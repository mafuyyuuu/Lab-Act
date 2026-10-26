// GET requests only: this script never creates, updates, or deletes remote data.
// Set API_BASE_URL for gateway checks, or per-service URLs for direct checks.
const services = [
    ["Student", "STUDENT_SERVICE_URL", "/students", "list"],
    ["Course", "COURSE_SERVICE_URL", "/courses", "courses"],
    ["Enrollment", "ENROLLMENT_SERVICE_URL", "/enrollments", "list"],
    ["Payment", "PAYMENT_SERVICE_URL", "/payments", "list"],
    ["Library", "LIBRARY_SERVICE_URL", "/books", "list"],
    ["Faculty", "FACULTY_SERVICE_URL", "/faculty", "list"]
];

async function main() {
    const gateway = process.env.API_BASE_URL;
    const checks = services.flatMap(([name, variable, path, shape]) => {
        const base = process.env[variable] || gateway;
        return base ? [{ name, base, path, shape }] : [];
    });
    const paymentBase = process.env.PAYMENT_SERVICE_URL || gateway;
    if (paymentBase) checks.push({ name: "Student payment", base: paymentBase, path: "/payments/student/1", shape: "payment" });
    // These GET routes are checked only when their direct service URLs are supplied;
    // the activity's gateway route list does not require exposing them.
    if (process.env.NOTIFICATION_SERVICE_URL) checks.push({ name: "Notification", base: process.env.NOTIFICATION_SERVICE_URL, path: "/notifications", shape: "list" });
    if (process.env.AUTH_SERVICE_URL) checks.push({ name: "Authentication", base: process.env.AUTH_SERVICE_URL, path: "/users/1", shape: "user" });
    if (!checks.length) throw new Error("Set API_BASE_URL or one or more *_SERVICE_URL variables");
    let failed = 0;
    for (const check of checks) {
        try {
            const response = await fetch(`${check.base.replace(/\/$/, "")}${check.path}`, {
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const body = await response.json();
            if (["list", "courses"].includes(check.shape) && !Array.isArray(body)) throw new Error("Expected a JSON array");
            if (check.shape === "courses" && !body.some(course => course.id === 101 && course.code === "IT204" && typeof course.title === "string" && course.units === 3)) throw new Error("Expected the assignment's course 101");
            if (check.shape === "payment" && (body.studentId !== 1 || typeof body.status !== "string")) throw new Error("Expected a payment status for student 1");
            if (check.shape === "user" && (body.id !== 1 || typeof body.role !== "string" || "password" in body || "passwordHash" in body || "salt" in body)) throw new Error("Invalid public user response");
            console.log(`PASS ${check.name}: GET ${check.path}`);
        } catch (error) {
            failed++;
            console.error(`FAIL ${check.name}: GET ${check.path}: ${error.message}`);
        }
    }
    console.log(`${checks.length - failed}/${checks.length} read-only checks passed. POST, PUT, DELETE, and login are not tested.`);
    if (failed) process.exitCode = 1;
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
