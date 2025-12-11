import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import LearnerHome from './pages/learner/LearnerHome';
import BankSetup from './pages/learner/BankSetup';
import Courses from './pages/learner/Courses';
import CourseDetails from './pages/learner/CourseDetails';
import MyCourses from './pages/learner/MyCourses';
import CourseContent from './pages/learner/CourseContent';
import Certificates from './pages/learner/Certificates';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorCourses from './pages/instructor/InstructorCourses';
import InstructorStudents from './pages/instructor/InstructorStudents';
import UploadCourse from './pages/instructor/UploadCourse';
import Earnings from './pages/instructor/Earnings';
import InstructorBankSetup from './pages/instructor/InstructorBankSetup';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Hide navbar on login and register pages
    const hideNavbar = location.pathname === '/login' || location.pathname === '/register';

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner"></div></div>;
    }

    return (
        <div className="App">
            {!hideNavbar && <Navbar />}
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
                <Route path="/learner/home" element={<ProtectedRoute allowedRoles={['learner']}><LearnerHome /></ProtectedRoute>} />
                <Route path="/learner/bank-setup" element={<ProtectedRoute allowedRoles={['learner']}><BankSetup /></ProtectedRoute>} />
                <Route path="/learner/courses" element={<ProtectedRoute allowedRoles={['learner']}><Courses /></ProtectedRoute>} />
                <Route path="/learner/course/:id" element={<ProtectedRoute allowedRoles={['learner']}><CourseDetails /></ProtectedRoute>} />
                <Route path="/learner/my-courses" element={<ProtectedRoute allowedRoles={['learner']}><MyCourses /></ProtectedRoute>} />
                <Route path="/learner/course-content/:courseId" element={<ProtectedRoute allowedRoles={['learner']}><CourseContent /></ProtectedRoute>} />
                <Route path="/learner/certificates" element={<ProtectedRoute allowedRoles={['learner']}><Certificates /></ProtectedRoute>} />
                <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorDashboard /></ProtectedRoute>} />
                <Route path="/instructor/bank-setup" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorBankSetup /></ProtectedRoute>} />
                <Route path="/instructor/my-courses" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorCourses /></ProtectedRoute>} />
                <Route path="/instructor/students" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorStudents /></ProtectedRoute>} />
                <Route path="/instructor/upload" element={<ProtectedRoute allowedRoles={['instructor']}><UploadCourse /></ProtectedRoute>} />
                <Route path="/instructor/earnings" element={<ProtectedRoute allowedRoles={['instructor']}><Earnings /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/" element={user ? (
                    user.role === 'learner' ? <Navigate to="/learner/home" /> :
                        user.role === 'instructor' ? <Navigate to="/instructor/dashboard" /> :
                            <Navigate to="/admin/dashboard" />
                ) : <Navigate to="/login" />} />
            </Routes>
        </div>
    );
}

export default App;
