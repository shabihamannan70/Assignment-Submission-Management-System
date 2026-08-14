# Assignment & Submission Management System

## 1. Project Overview
This project is a comprehensive role-based Assignment and Submission Management System built for schools and colleges. Its main purpose is to streamline the educational workflow between administrators, teachers, and students.
- **Admin**: Manages users, creates classes and subjects, assigns teachers, and enrolls students.
- **Teacher**: Manages their assigned assignments, publishes assignments to enrolled students, reviews submissions, and provides grades and feedback.
- **Student**: Views assignments for their enrolled classes, submits files and answers, updates submissions before deadlines, and reviews their graded results and feedback.

## 2. Main Features

### Admin
- User management (Create, View, Update, Deactivate users)
- Class and Subject management (Create, View, Edit, Delete)
- Teacher assignments (Assign teachers to classes and subjects)
- Student enrollment (Enroll students in specific classes)
- Monitor all assignments and submissions platform-wide
- View aggregate dashboard statistics

### Teacher
- View assigned classes and subjects
- Create, Edit, and Delete assignments (limited strictly to their own ownership)
- Publish assignments (making them visible to students)
- View all student submissions for their assignments
- Securely download student file attachments
- Grade submissions and provide text feedback

### Student
- View assignments specifically for classes they are enrolled in
- Submit text answers and file attachments securely
- Update or resubmit answers before the assignment deadline
- View real-time submission statuses (Pending, Submitted, Overdue, Graded)
- Review marks, teacher feedback, and downloaded attachments via the Results view
- Aggregate Dashboard displaying "Total assignments", "Pending", "Submitted", "Graded", and "Average marks" statistics

## 3. Assignment Lifecycle
1. **Teacher creates assignment** (Status: Draft)
2. **Teacher publishes assignment**
3. **Enrolled students see assignment**
4. **Student submits answer/file** (Status: Submitted)
5. **Student can update before deadline** (if allowed)
6. **Teacher grades**
7. **Submission becomes Graded** (Status: Graded)
8. **Student sees marks and feedback**
9. **Graded submission becomes locked** (Neither student nor teacher can modify further without Admin intervention)

## 4. Submission Lifecycle
- **Text answer**: Students can type direct text answers.
- **File attachment**: Students can upload supported files.
- **Resubmission**: If the deadline has not passed and the submission is not yet graded, the student can update the answer/attachment.
- **Deadline**: Submissions and updates are strictly rejected past the deadline.
- **Grading**: Once graded, the submission becomes locked.
- **One submission per student per assignment**: Enforced uniquely at the database level.

## 5. Technology Stack
### Backend
- **Framework**: .NET 10.0 (ASP.NET Core Web API)
- **Language**: C#
- **Database**: PostgreSQL
- **ORM**: Entity Framework Core
- **Authentication**: JWT Bearer Authentication
- **Testing Framework**: xUnit

### Frontend
- **Framework**: Next.js 16.3 (App Router)
- **Language**: TypeScript
- **UI Framework**: React, Tailwind CSS
- **Icons**: Lucide-React
- **Form Validation**: React Hook Form, Zod

## 6. Project Structure
```text
/
├── api/             # ASP.NET Core API entry point and Controllers
├── core/            # Domain Entities, DTOs, Enums, and Interfaces
├── infrastructure/  # EF Core DbContext, Migrations, Services, and Seeder
├── tests/           # xUnit Integration/Unit test project
├── frontend/        # Next.js 16 frontend application
└── README.md        # Project documentation
```

## 7. Prerequisites
- **.NET SDK**: 10.0 or higher
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Database**: PostgreSQL (Ensure you have a running instance)

## 8. Backend Setup
1. Clone the repository.
2. Navigate to the `api` directory: `cd api`
3. Ensure PostgreSQL is running.
4. Copy `appsettings.example.json` to `appsettings.json` and configure your database connection string and JWT secret:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=assignment_db;Username=postgres;Password=YOUR_DATABASE_PASSWORD"
   }
   ```
5. Apply database migrations: `dotnet ef database update --project ../infrastructure --startup-project .`
6. (Optional for dev) The database automatically seeds itself on startup if empty in Development environment.
7. Run the API: `dotnet run` (Runs on `http://localhost:5104`)

## 9. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Copy the `.env.example` file to `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5104
   ```
4. Run the development server: `npm run dev` (Runs on `http://localhost:3000`)

## 10. Database Setup
- **Connection String**: Located in `api/appsettings.json` under `ConnectionStrings:DefaultConnection`.
- **Migrations**: Stored in `infrastructure/Migrations`.
- **Update Command**: Run `dotnet ef database update` from the `api` directory.
- **Seeder**: Located in `infrastructure/Data/DatabaseSeeder.cs`. It automatically provisions demo accounts and initial classes/subjects if the database is completely empty.

## 11. Environment Configuration
### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_BASE_URL`: The URL where the backend API is hosted. Default is `http://localhost:5104`.

### Backend (`api/appsettings.json`)
- `ConnectionStrings:DefaultConnection`: PostgreSQL connection string.
- `Jwt:SecretKey`: Must be at least 32 characters long.
- `DemoAccounts`: The passwords used for the database seeder if you wish to change the defaults.

*(Note: Do not commit actual production secrets to source control.)*

## 12. Demo Accounts
For local development, the system seeds demo accounts upon first startup. The default demo credentials can be configured in `appsettings.Development.json` under `DemoAccounts`. By default, they are:

- **Admin**: `admin@example.com` / `Admin@123!`
- **Teacher**: `teacher@example.com` / `Teacher@123!`
- **Student**: `student@example.com` / `Student@123!`

## 13. API
- **API Base URL**: `http://localhost:5104/api/`
- **Swagger URL**: `http://localhost:5104/swagger` (Available in Development mode)
- **Authentication**: JWT Bearer Tokens in the `Authorization` header.
- **Main Endpoint Groups**: `/api/auth`, `/api/admin`, `/api/assignments`, `/api/student`, `/api/teacher`, `/api/submissions`.

## 14. Authentication
- The system uses **JWT (JSON Web Tokens)** for stateless authentication.
- Users receive a token upon logging in at `/api/auth/login`.
- The token securely encodes the user's `NameIdentifier` (ID) and `Role` (Admin, Teacher, Student).
- Controllers use `[Authorize(Roles = "...")]` to enforce role-specific boundaries.

## 15. Authorization / Security
- **JWT Identity**: The backend derives `TeacherId` and `StudentId` strictly from the signed JWT claim, never trusting client-supplied IDs.
- **Ownership Checks**: Teachers can only view/edit/delete/grade assignments they created. Students can only view/update their own submissions.
- **Class Enrollment**: Students cannot view assignments for classes they are not explicitly enrolled in.
- **IDOR Protection**: All requests validating specific resources (like a submission ID) cross-reference the JWT identity to prevent unauthorized cross-student or cross-teacher access.
- **Path Traversal Protection**: Uploaded files are renamed securely to GUIDs on the server disk.

## 16. File Submission
- **Supported File Types**: `.pdf`, `.doc`, `.docx`, `.txt`, `.jpg`, `.jpeg`, `.png`
- **Maximum File Size**: 10MB
- **Upload Behavior**: Files are streamed and stored securely on the backend under `api/uploads/submissions`.
- **Download Behavior**: Files can only be downloaded via an authenticated endpoint.
- **Authorization**: Only the submitting student, the assignment's teacher, and Admins can download the attachments.

## 17. Testing
To run the automated tests, execute the following verified commands:

**Backend Tests**
```bash
cd tests/AssignmentSystem.Tests
dotnet test
```

**Frontend Type Checking and Build**
```bash
cd frontend
npx tsc --noEmit
npm run build
```

## 18. User Workflows

### Admin Workflow
`Login` → `Create Users` → `Create Classes & Subjects` → `Assign Teachers` → `Enroll Students` → `Monitor Assignments/Submissions via Dashboard`

### Teacher Workflow
`Login` → `View Dashboard` → `Create Assignment for Assigned Class/Subject` → `Publish` → `View Student Submissions` → `Download Files` → `Grade & Feedback`

### Student Workflow
`Login` → `View Enrolled Assignments` → `Submit Answer/File` → `Update before Deadline (if allowed)` → `Wait for Grading` → `View Result (Marks & Feedback)`

## 19. Same-Name User Handling
Users are uniquely identified by a UUID generated upon creation. If multiple users have the exact same name, the system internally maintains separation. The UI specifically displays "Name — Email" in dropdowns to prevent administrative confusion.

## 20. Assignment Visibility Rules
- **Draft Status**: Visible only to the teacher who created it and Admins. Hidden from students.
- **Published Status**: Visible to students who are actively enrolled in the assignment's target class.
- **Deadlines**: Assignments dynamically display as "Pending" or "Overdue" based on the deadline timestamp relative to the current UTC time.

## 21. Submission Rules
- **Uniqueness**: A student can strictly only have one submission record per assignment.
- **Resubmission**: Updates simply overwrite the existing answer and attachment record safely.
- **Grading Lock**: Once a teacher applies a grade, the submission is strictly locked preventing further edits by the student or the teacher.

## 22. Troubleshooting
- **API not running**: Check if PostgreSQL is running and credentials in `appsettings.json` are correct.
- **Database Connection Failure**: The backend will crash on startup if `DefaultConnection` is invalid. Ensure your DB user has create privileges for EF Migrations.
- **Frontend API URL Mismatch**: Ensure `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` accurately points to your local `.NET` server port (typically 5104).
- **Migration Issues**: If the database schema is out of sync, delete the existing database and run `dotnet ef database update`.

## 23. Build Verification
```bash
# Backend Verification
dotnet build
dotnet test
# Expected: "Build succeeded", "Passed! - Failed: 0, Passed: 22"

# Frontend Verification
cd frontend
npm install
npm run build
# Expected: "Compiled successfully", "Generating static pages"
```

## 24. License / Academic Note
This project is submitted as an academic/recruitment assignment demonstration.