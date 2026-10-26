# University Digital Services Platform — Group 1

Local Express APIs and Docker images for the BSIT 4B IT204 four-week activity.
This repository contains Group 1's API/image work. It does not provision AWS,
push to ECR, change ECS/Fargate, or configure an API Gateway.

## Responsibility and handoff

The activity assigns Group 1 API creation, local testing and Docker image builds
in Steps 1-5, 21-23 (with Group 9 on API creation), 31-33 and 41-43.
Group 10 owns the student lookup integration in Step 29. Its existing route is
preserved and corrected here. Step 30's owner is not specified in the handout.
Additional course/payment orchestration belongs to the integration handoff;
this change provides the API contracts rather than changing the cloud setup.

Follow the professor's current instruction to validate the deployed platform.
Local source edits do not change running cloud containers. A later image build,
push and redeployment by the assigned groups can publish these changes. All
groups contribute to one platform, so coordinate field/endpoint changes.

## Services

| Folder | Port | Endpoints |
| --- | --- | --- |
| student-service | 3001 | GET/POST /students; GET/PUT/DELETE /students/:id |
| course-service | 3002 | GET/POST /courses; GET/PUT/DELETE /courses/:id |
| enrollment-service | 3003 | GET/POST /enrollments; GET/PUT/DELETE /enrollments/:id; GET /student-enrollment/:id |
| payment-service | 3004 | GET/POST /payments; GET/PUT /payments/:id; GET /payments/student/:id |
| library-service | 3005 | GET/POST /books; GET/PUT/DELETE /books/:id |
| faculty-service | 3006 | GET/POST /faculty; GET/PUT/DELETE /faculty/:id |
| notification-service | 3007 | GET/POST /notifications; GET /notifications/:id |
| auth-service | 3008 | POST /register; POST /login; GET /users/:id |

Sample Student, Course, Enrollment, Payment and Notification records follow the
handout. Library and Faculty retain the existing illustrative data because the
handout does not prescribe their fields. POST generates IDs. PUT supports
partial updates. Required fields/types are validated; malformed JSON and invalid
IDs return 400, missing records return 404, duplicate usernames return 409 and
incorrect login credentials return 401.

## Run with Docker Desktop

From the repository root:

```bash
docker compose up --build -d
docker compose ps
```

All host ports match container ports, 3001-3008. Compose tags images
`student-service:1.0` through `auth-service:1.0` for the ECR team's handoff.
It does not push them. Each image can also be built individually, for example:

```bash
docker build -t course-service:1.0 ./course-service
```

All Dockerfiles retain the activity's Node 20 family, install from the lockfile
with `npm ci`, copy only the service source, and run as the non-root node user.
Use the architecture agreed with the deployment team when building images for
handoff. Match the image architecture to their ECS task runtime architecture.

## Run directly with Node

Use Node 20 or later. In each service folder, run `npm ci` and `npm start` in
its own terminal. Stop containers using these same ports before doing this.
For Enrollment, `STUDENT_SERVICE_URL` defaults to `http://localhost:3001`.
Compose sets it to `http://student-service:3001`. When deployed separately, the
deployment team must supply its reachable Student URL as an environment variable.
`/student-enrollment/1` refers to enrollment ID 1; that record's `studentId` is
used to fetch the student's information. This route returns enrollment + student,
without automatically invoking Course, Payment or Notification.

## Local tests

Install each service's dependencies once (repeat with each of the eight folders):

```bash
cd student-service
npm ci
cd ..
```

Then from the repository root run:

```bash
npm test
```

The tests start isolated Node processes on ports 3001-3008, exercise CRUD,
validation, student lookup and the final business sequence, then stop their own
processes. Stop existing local services first. They never call AWS endpoints.

## Final sequence to validate

1. POST `http://localhost:3008/login` with `{"username":"juan","password":"demo123"}`.
2. GET `http://localhost:3001/students/1`.
3. GET `http://localhost:3002/courses` (includes course 101, IT204, 3 units).
4. POST `http://localhost:3003/enrollments` with `{"studentId":1,"courseId":101,"semester":"1st Semester","schoolYear":"2026-2027"}`.
5. GET `http://localhost:3004/payments/student/1`.
6. POST `http://localhost:3007/notifications` with `{"studentId":1,"message":"Your enrollment has been confirmed.","type":"EMAIL"}`.

Payment lookup by student returns that student's newest recorded payment. It does
not calculate a balance. The caller supplies the enrollment's studentId; payment
IDs such as 1001 are not student IDs. The sequence above is manually orchestrated,
as in the activity's Postman scenario. Course/Payment calls from Enrollment and
gateway routing remain integration work for the assigned teams.

## Validate the deployed platform without changing records

Ask the deployment team for the actual endpoint URLs. For a gateway:

```bash
API_BASE_URL=https://YOUR_GATEWAY_HOST/YOUR_STAGE npm run validate:deployed
```

For direct service endpoints, supply the reachable URLs rather than localhost:

```bash
STUDENT_SERVICE_URL=http://STUDENT_PUBLIC_IP:3001 \
COURSE_SERVICE_URL=http://COURSE_PUBLIC_IP:3002 \
ENROLLMENT_SERVICE_URL=http://ENROLLMENT_PUBLIC_IP:3003 \
PAYMENT_SERVICE_URL=http://PAYMENT_PUBLIC_IP:3004 \
LIBRARY_SERVICE_URL=http://LIBRARY_PUBLIC_IP:3005 \
FACULTY_SERVICE_URL=http://FACULTY_PUBLIC_IP:3006 \
NOTIFICATION_SERVICE_URL=http://NOTIFICATION_PUBLIC_IP:3007 \
AUTH_SERVICE_URL=http://AUTH_PUBLIC_IP:3008 \
npm run validate:deployed
```

This validator only sends GET requests. It checks connectivity and response
contracts without changing shared records. It reports missing routes rather
than attempting to fix AWS. Full login/CRUD/notification testing remains the
coordinated Postman scenario with the professor and assigned groups.

## Classroom limitations

- All data is in memory and resets on restart. There is no shared database.
- Authentication demonstrates login and role responses; it does not issue a
  session/token or protect the other services. Passwords are salted/hashed and
  never returned by the API. Use demo credentials only.
- Notification delivery is simulated. `SENT` means the simulated action completed,
  and each record is marked `delivery: "SIMULATED"`; no real email/SMS is sent.
- All sample IDs and URLs are for the classroom activity.
