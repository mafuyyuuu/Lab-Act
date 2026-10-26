const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { createServer } = require("node:net");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const serviceNames = ["student", "course", "enrollment", "payment", "library", "faculty", "notification", "auth"];

async function request(port, route, method = "GET", body, expected = 200) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`);
    return result;
}

async function assertPortFree(port) {
    await new Promise((resolve, reject) => {
        const probe = createServer();
        probe.once("error", () => reject(new Error(`Port ${port} is occupied. Stop local services before npm test.`)));
        probe.listen(port, "0.0.0.0", () => probe.close(resolve));
    });
}

function startService(name) {
    const child = spawn(process.execPath, ["server.js"], {
        cwd: path.join(root, `${name}-service`),
        env: { ...process.env, STUDENT_SERVICE_URL: "http://127.0.0.1:3001/" },
        stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    const ready = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`${name} did not start: ${output}`)), 10000);
        child.on("error", error => { clearTimeout(timeout); reject(error); });
        child.on("exit", code => {
            clearTimeout(timeout);
            reject(new Error(`${name} exited (${code}): ${output}`));
        });
        child.stderr.on("data", chunk => { output += chunk; });
        child.stdout.on("data", chunk => {
            output += chunk;
            if (output.includes("running on port")) { clearTimeout(timeout); resolve(); }
        });
    });
    return { child, ready };
}

async function stopService(child) {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await new Promise(resolve => {
        child.once("exit", resolve);
        child.kill("SIGTERM");
    });
}

test("Group 1 local service contracts", { timeout: 60000 }, async t => {
    // Check all ports first; never stop or modify a service we did not start.
    for (let port = 3001; port <= 3008; port++) await assertPortFree(port);
    const processes = serviceNames.map(startService);
    try {
        await Promise.all(processes.map(process => process.ready));

        const contracts = [
            [3001, "/students", "student", 1, { name: "Demo Student", course: "BSIT", year: 2 }, { year: 3 }, true],
            [3002, "/courses", "course", 101, { code: "IT205", title: "Demo Course", units: 3 }, { units: 4 }, true],
            [3003, "/enrollments", "enrollment", 1, { studentId: 2, courseId: 101, semester: "1st Semester", schoolYear: "2026-2027" }, { semester: "2nd Semester" }, true],
            [3004, "/payments", "payment", 1001, { studentId: 2, amount: 15000, status: "PENDING" }, { amount: 0, status: "PAID" }, false],
            [3005, "/books", "book", 1, { title: "Demo Book", author: "Demo Author", year: 2026 }, { year: 2027 }, true],
            [3006, "/faculty", "faculty", 1, { name: "Demo Faculty", department: "Computing", position: "Instructor" }, { position: "Professor" }, true]
        ];
        for (const [port, route, key, seedId, data, update, deletable] of contracts) {
            await t.test(`${key}: CRUD, IDs, validation and JSON errors`, async () => {
                assert.ok(Array.isArray(await request(port, route)));
                assert.equal((await request(port, `${route}/${seedId}`)).id, seedId);
                await request(port, `${route}/999999`, "GET", undefined, 404);
                await request(port, `${route}/bad`, "GET", undefined, 400);
                await request(port, route, "POST", {}, 400);
                await request(port, route, "POST", [], 400);
                await request(port, route, "POST", null, 400);
                const created = (await request(port, route, "POST", data, 201))[key];
                assert.ok(created.id > seedId);
                const updated = (await request(port, `${route}/${created.id}`, "PUT", update))[key];
                for (const [field, value] of Object.entries({ ...data, ...update })) assert.equal(updated[field], value);
                await request(port, `${route}/${created.id}`, "PUT", { [Object.keys(data)[0]]: null }, 400);
                assert.deepEqual(await request(port, `${route}/${created.id}`), updated);
                await request(port, `${route}/999999`, "PUT", update, 404);
                await request(port, `${route}/${created.id}`, "PUT", { id: 999 }, 400);
                const malformed = await fetch(`http://127.0.0.1:${port}${route}`, {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad"
                });
                assert.equal(malformed.status, 400);
                assert.equal((await malformed.json()).message, "Invalid JSON body");
                if (deletable) {
                    const deleted = await request(port, `${route}/${created.id}`, "DELETE");
                    assert.equal(deleted[key].id, created.id);
                    await request(port, `${route}/${created.id}`, "GET", undefined, 404);
                    await request(port, `${route}/${created.id}`, "DELETE", undefined, 404);
                    const next = (await request(port, route, "POST", data, 201))[key];
                    assert.ok(next.id > created.id, "Deleted IDs must not be reused");
                }
            });
        }

        await t.test("Enrollment retrieves the student referenced by studentId", async () => {
            const result = await request(3003, "/student-enrollment/1");
            assert.equal(result.enrollment.studentId, 1);
            assert.equal(result.student.name, "Juan Dela Cruz");
            await request(3003, "/student-enrollment/999999", "GET", undefined, 404);
            await request(3003, "/student-enrollment/bad", "GET", undefined, 400);
            const created = await request(3003, "/enrollments", "POST", {
                studentId: 999999, courseId: 101, semester: "1st Semester", schoolYear: "2026-2027"
            }, 201);
            const missing = await request(3003, `/student-enrollment/${created.enrollment.id}`, "GET", undefined, 404);
            assert.equal(missing.message, "Student not found");
        });

        await t.test("Payment lookup uses student IDs and preserves zero amounts", async () => {
            assert.equal((await request(3004, "/payments/student/1")).id, 1001);
            assert.equal((await request(3004, "/payments/student/2")).amount, 0);
            await request(3004, "/payments/student/999999", "GET", undefined, 404);
            await request(3004, "/payments/student/bad", "GET", undefined, 400);
            await request(3004, "/payments", "POST", { studentId: 1, amount: -1, status: "PAID" }, 400);
        });

        await t.test("Authentication registers, rejects duplicates and never returns password data", async () => {
            const created = await request(3008, "/register", "POST", {
                username: "demo-student", password: "demo456", role: "admin"
            }, 201);
            assert.equal(created.user.role, "student");
            const user = await request(3008, `/users/${created.user.id}`);
            assert.deepEqual(Object.keys(user).sort(), ["id", "role", "username"]);
            await request(3008, "/register", "POST", { username: "DEMO-STUDENT", password: "demo456" }, 409);
            const login = await request(3008, "/login", "POST", { username: "demo-student", password: "demo456" });
            assert.equal(login.role, "student");
            await request(3008, "/login", "POST", { username: "demo-student", password: "wrong123" }, 401);
            await request(3008, "/login", "POST", { username: "missing", password: "wrong123" }, 401);
            await request(3008, "/register", "POST", { username: "", password: "x" }, 400);
            await request(3008, "/login", "POST", {}, 400);
            await request(3008, "/users/999999", "GET", undefined, 404);
            await request(3008, "/users/bad", "GET", undefined, 400);
        });

        await t.test("Notification API creates and reads simulated delivery records", async () => {
            assert.ok(Array.isArray(await request(3007, "/notifications")));
            assert.equal((await request(3007, "/notifications/701")).delivery, "SIMULATED");
            const created = await request(3007, "/notifications", "POST", {
                studentId: 1, message: "Demo confirmation", type: "EMAIL"
            }, 201);
            assert.equal(created.notification.id, 702);
            assert.equal(created.notification.status, "SENT");
            assert.equal((await request(3007, "/notifications/702")).message, "Demo confirmation");
            await request(3007, "/notifications", "POST", {}, 400);
            await request(3007, "/notifications/999999", "GET", undefined, 404);
            await request(3007, "/notifications/bad", "GET", undefined, 400);
        });

        await t.test("The activity's final business sequence uses matching records", async () => {
            const login = await request(3008, "/login", "POST", { username: "juan", password: "demo123" });
            assert.equal(login.message, "Login successful");
            const student = await request(3001, "/students/1");
            const course = (await request(3002, "/courses")).find(item => item.id === 101);
            assert.deepEqual(course, { id: 101, code: "IT204", title: "System Integration and Architecture 2", units: 3 });
            const created = await request(3003, "/enrollments", "POST", {
                studentId: student.id, courseId: course.id, semester: "1st Semester", schoolYear: "2026-2027"
            }, 201);
            assert.equal(created.message, "Enrollment created successfully");
            assert.equal((await request(3004, `/payments/student/${student.id}`)).status, "PAID");
            const notification = await request(3007, "/notifications", "POST", {
                studentId: student.id, message: "Your enrollment has been confirmed.", type: "EMAIL"
            }, 201);
            assert.equal(notification.message, "Notification sent successfully");
        });

        await t.test("Deployed validator can check the same contracts using GET only", async () => {
            const before = await request(3003, "/enrollments");
            const env = { ...process.env, API_BASE_URL: "" };
            for (const [index, name] of serviceNames.entries()) {
                env[`${name.toUpperCase()}_SERVICE_URL`] = `http://127.0.0.1:${3001 + index}`;
            }
            await new Promise((resolve, reject) => {
                const child = spawn(process.execPath, ["scripts/validate-deployed.js"], { cwd: root, env });
                let output = "";
                child.stdout.on("data", chunk => { output += chunk; });
                child.stderr.on("data", chunk => { output += chunk; });
                child.on("error", reject);
                child.on("exit", code => code === 0 ? resolve() : reject(new Error(output)));
            });
            assert.deepEqual(await request(3003, "/enrollments"), before);
        });

        await t.test("Enrollment handles an unavailable upstream with 502", async () => {
            await stopService(processes[0].child);
            const result = await request(3003, "/student-enrollment/1", "GET", undefined, 502);
            assert.equal(result.message, "Cannot retrieve information from student service");
        });
    } finally {
        await Promise.all(processes.map(process => stopService(process.child)));
    }
});
