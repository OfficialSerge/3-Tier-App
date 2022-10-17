import './App.css'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PrivateRoute } from './components/PrivateRoute'
import { AuthProvider } from './contexts/AuthContext'

import { Signup } from './components/Signup'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { ForgotPassword } from './components/ForgotPassword'
import { UpdateProfile } from './components/UpdateProfile'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className='App'>
          <Routes>
            <Route exact path='/' element={<PrivateRoute />}>
              <Route exact path='/' element={<Dashboard />} />
            </Route>
            <Route exact path='/update-profile' element={<PrivateRoute />}>
              <Route exact path='/update-profile' element={<UpdateProfile />} />
            </Route>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
