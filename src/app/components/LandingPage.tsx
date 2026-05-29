import { ChevronRight } from 'lucide-react';
import logoImage from '../../imports/majtech_vector_logo_3.png';

interface LandingPageProps {
  onSelectSystem: (systemId: string) => void;
}

const systems = [
  {
    id: 'BU1',
    name: 'CMS-BU1-CONSULTING',
    description: 'Consulting business unit compliance tracking and management',
    color: 'from-[#5B9BD5] to-[#4682B4]',
    icon: '📊'
  },
  {
    id: 'BU2',
    name: 'CMS-BU2-SOFTWARE DEVELOPMENT',
    description: 'Software development business unit compliance tracking',
    color: 'from-[#FFE54D] to-[#FFD700]',
    icon: '💻'
  },
  {
    id: 'BU3',
    name: 'CMS-BU3-COOPERATIVE',
    description: 'Cooperative business unit compliance tracking',
    color: 'from-[#87CEEB] to-[#5B9BD5]',
    icon: '🤝'
  }
];

export function LandingPage({ onSelectSystem }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2C5282] via-[#4682B4] to-[#2C5282] relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo and Title */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="mb-6 flex justify-center">
            <img src={logoImage} alt="Majtech Logo" className="w-32 h-32 object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            COMPLIANCE
          </h1>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            MANAGEMENT SYSTEM
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Select your business unit to access the compliance management system
          </p>
        </div>

        {/* System Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl w-full px-4">
          {systems.map((system, index) => (
            <div
              key={system.id}
              className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => onSelectSystem(system.id)}
            >
              {/* Card Content */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{system.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {system.name}
                </h2>
                <p className="text-sm text-gray-300">
                  {system.description}
                </p>
              </div>

              {/* Button */}
              <button className={`w-full bg-gradient-to-r ${system.color} text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 group-hover:shadow-xl transition-all`}>
                Access System
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${system.color} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity blur-xl`}></div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-400 text-sm">
          <p>© 2026 Compliance Management System. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out backwards;
        }
      `}</style>
    </div>
  );
}
