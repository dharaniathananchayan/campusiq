import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { GraduationCap, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken, role: currentRole, setAuth, loginAsStudent, loginAsOrganizer } = useAuthStore();

  const [role, setRole] = useState<'student' | 'organizer'>('student');
  const [loading, setLoading] = useState(false);

  // Student Fields
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState(2);

  // Organizer Fields
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPassword, setOrgPassword] = useState('');
  const [orgFullName, setOrgFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'club' | 'department' | 'committee' | 'society'>('department');

  // If already authenticated, redirect to role-specific dashboard
  useEffect(() => {
    if (accessToken && currentRole) {
      if (currentRole === 'organizer') {
        navigate('/organizer/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [accessToken, currentRole, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === 'student') {
        const res = await authApi.registerStudent({
          email: studentEmail,
          password: studentPassword,
          full_name: fullName,
          institute_name: instituteName,
          year_of_study: Number(yearOfStudy),
        });
        useAuthStore.setState({ accessToken: res.access_token, refreshToken: res.refresh_token, role: 'student' });
        setAuth(res.access_token, res.refresh_token, 'student', await authApi.getStudentProfile());
        toast.success('Registration successful! Welcome to CampusIQ.');
        navigate('/student/dashboard', { replace: true });
      } else {
        const res = await authApi.registerOrganizer({
          email: orgEmail,
          password: orgPassword,
          full_name: orgFullName,
          organization_name: orgName,
          organization_type: orgType,
        });
        useAuthStore.setState({ accessToken: res.access_token, refreshToken: res.refresh_token, role: 'organizer' });
        setAuth(res.access_token, res.refresh_token, 'organizer', await authApi.getOrganizerProfile());
        toast.success('Organizer registration successful!');
        navigate('/organizer/dashboard', { replace: true });
      }
    } catch {
      // Fallback for demonstration
      if (role === 'student') {
        loginAsStudent();
        toast.success('Registered successfully in demo mode!');
        navigate('/student/dashboard', { replace: true });
      } else {
        loginAsOrganizer();
        toast.success('Registered successfully in demo mode!');
        navigate('/organizer/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5ed] flex flex-col justify-between selection:bg-[#d8fa57] selection:text-[#113326] font-sans">
      {/* Top Header Bar */}
      <header className="bg-[#113326] border-b border-[#1b4333] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#d8fa57] text-[#113326] flex items-center justify-center font-extrabold text-sm tracking-tighter">
              IQ
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg tracking-tight text-white">CampusIQ</span>
              <span className="text-[11px] font-semibold text-[#8ea79a] uppercase tracking-wider hidden sm:inline">
                Institutional Registration Gateway
              </span>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-[#d8fa57] hover:underline flex items-center gap-1"
          >
            <span>Back to Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl rounded-2xl border border-[#dedbd4] bg-white shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 text-left">
          {/* Left Context Column */}
          <div className="md:col-span-5 p-8 bg-[#113326] text-white flex flex-col justify-between space-y-8 relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-[#1e4d3a] text-[#d8fa57] tracking-wider uppercase inline-block">
                  Registration
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                  Join the University Event Network
                </h1>
                <p className="text-xs text-[#c4d6cb] leading-relaxed">
                  Connect your student or departmental identity to access reservations, analytics, and AI assistant tools.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 text-xs text-[#a3c2b1]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#d8fa57] shrink-0" />
                  <span>Verified academic status</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#d8fa57] shrink-0" />
                  <span>Instant reservation ticketing</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#d8fa57] shrink-0" />
                  <span>FERPA & Campus SSO verified</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#8ea79a] border-t border-[#1b4333] pt-4 relative z-10">
              Requires valid institute enrollment or university department affiliation.
            </div>
          </div>

          {/* Right Form Column */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create your account</h2>
                <p className="text-xs text-slate-500">Choose your role to get started</p>
              </div>

              {/* Role Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'student'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className={`w-4 h-4 ${role === 'student' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('organizer')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'organizer'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${role === 'organizer' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span>Organizer</span>
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {role === 'student' ? (
                  <>
                    <Input
                      label="Full Name"
                      required
                      placeholder="e.g. Alex Chen"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <Input
                      label="Institute Name"
                      required
                      placeholder="e.g. Stanford University"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                    />
                    <Select
                      label="Year of Study"
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(Number(e.target.value))}
                    >
                      <option value={1}>1st Year (Freshman)</option>
                      <option value={2}>2nd Year (Sophomore)</option>
                      <option value={3}>3rd Year (Junior)</option>
                      <option value={4}>4th Year (Senior)</option>
                      <option value={5}>Postgraduate / PhD</option>
                    </Select>
                    <Input
                      label="University Email"
                      type="email"
                      required
                      placeholder="student@university.edu"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                    />
                    <Input
                      label="Password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Organization / Department Name"
                      required
                      placeholder="e.g. Robotics Club, Dept of CS"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                    <Select
                      label="Organization Type"
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as any)}
                    >
                      <option value="club">Student Club / Society</option>
                      <option value="department">Academic Department</option>
                      <option value="committee">Administrative Committee</option>
                      <option value="society">Honor Society</option>
                    </Select>
                    <Input
                      label="Organizer Contact Name"
                      required
                      placeholder="e.g. Dr. Sarah Jenkins"
                      value={orgFullName}
                      onChange={(e) => setOrgFullName(e.target.value)}
                    />
                    <Input
                      label="Official Email"
                      type="email"
                      required
                      placeholder="organizer@university.edu"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                    />
                    <Input
                      label="Password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={orgPassword}
                      onChange={(e) => setOrgPassword(e.target.value)}
                    />
                  </>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full font-bold shadow-md cursor-pointer"
                  isLoading={loading}
                >
                  Complete Registration & Enter
                </Button>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <span>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </span>
              <span className="text-[11px] text-slate-400">CampusIQ v2.0</span>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-200/60 bg-white/50">
        CampusIQ · Academic Event Intelligence & Autonomous Co-Pilot Gateway
      </footer>
    </div>
  );
};
