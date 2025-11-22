import type { Mentor, Mentee, ConnectionRequest, Mentorship, Session } from '../types';

const generateAvailability = (startOffset = 1, numDays = 10) => {
    const availability: Record<string, string[]> = {};
    for (let i = startOffset; i < startOffset + numDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        if (Math.random() > 0.3) {
            availability[dateString] = ['10:00', '11:30', '14:00', '16:30'].filter(() => Math.random() > 0.5);
        }
    }
    return availability;
};

export const mockMentors: Mentor[] = [
    {
        id: 1,
        name: 'Dr. Elena Rodriguez',
        avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/42.jpg',
        title: 'Senior Data Scientist',
        company: 'Innovate AI',
        rating: 4.9,
        reviews: 32,
        expertise: ['Ciencia de Datos', 'Machine Learning', 'Python', 'Gestión de Producto'],
        longBio: 'Con más de 10 años de experiencia liderando equipos de ciencia de datos, me apasiona ayudar a la próxima generación de mujeres en tecnología a navegar sus carreras. Mi especialidad es la aplicación de machine learning a problemas del mundo real y la estrategia de producto basada en datos.',
        mentoringTopics: ['Orientación profesional', 'Desarrollo de habilidades técnicas', 'Preparación para entrevistas'],
        availability: generateAvailability(),
        maxMentees: 3,
        roleLevel: 'lead',
        timezone: 'America/Mexico_City',
        motivations: ['Empoderar a mujeres', 'Resolver problemas complejos', 'Innovación Tecnológica'],
        links: [
            { title: 'Publicación en "AI Today"', url: 'https://example.com/ai-today-publication' },
            { title: 'Certificación en Deep Learning', url: 'https://coursera.org/verify/12345' }
        ]
    },
    {
        id: 2,
        name: 'Sofia Chen',
        avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/35.jpg',
        title: 'Lead UX/UI Designer',
        company: 'Creative Solutions',
        rating: 4.8,
        reviews: 25,
        expertise: ['Diseño UX/UI', 'Design Systems', 'Figma', 'Investigación de Usuarios'],
        longBio: 'Diseñadora de productos con un enfoque en la creación de experiencias de usuario intuitivas y accesibles. He trabajado en startups y grandes corporaciones, y me encanta compartir mi conocimiento sobre procesos de diseño, creación de portafolios y cómo tener éxito en la industria del diseño.',
        mentoringTopics: ['Revisión de CV/Portafolio', 'Preparación para entrevistas', 'Networking en la industria'],
        availability: generateAvailability(2, 8),
        maxMentees: 2,
        roleLevel: 'senior',
        timezone: 'America/Bogota',
        motivations: ['Desarrollo de talento', 'Crear productos impactantes'],
    },
    {
        id: 3,
        name: 'Isabella Garcia',
        avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/21.jpg',
        title: 'Ingeniera de Software Principal',
        company: 'TechCorp',
        rating: 5.0,
        reviews: 41,
        expertise: ['Desarrollo de Software', 'Arquitectura de Sistemas', 'Cloud Computing', 'JavaScript'],
        longBio: 'Apasionada por construir sistemas escalables y robustos. Con experiencia en el ciclo de vida completo del desarrollo de software, desde la concepción hasta el despliegue. Puedo ayudarte con temas de arquitectura, mejores prácticas de codificación y crecimiento profesional en ingeniería.',
        mentoringTopics: ['Desarrollo de habilidades técnicas', 'Orientación profesional', 'Balance vida-trabajo'],
        availability: generateAvailability(3, 12),
        maxMentees: 4,
        roleLevel: 'senior',
        timezone: 'America/Argentina/Buenos_Aires',
        motivations: ['Excelencia técnica', 'Resolver problemas complejos'],
    },
    {
        id: 4,
        name: 'Maria Hernandez',
        avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/11.jpg',
        title: 'Fundadora y CEO',
        company: 'EcoInnovate',
        rating: 4.9,
        reviews: 18,
        expertise: ['Emprendimiento', 'Sostenibilidad', 'Estrategia de Negocios', 'Biotecnología'],
        longBio: 'Fundé EcoInnovate con la misión de utilizar la biotecnología para resolver problemas ambientales. Como emprendedora, he navegado el mundo del levantamiento de capital, la construcción de equipos y el desarrollo de productos. Estoy aquí para guiar a futuras líderes y fundadoras.',
        mentoringTopics: ['Networking en la industria', 'Orientación profesional', 'Emprendimiento'],
        availability: generateAvailability(1, 7),
        maxMentees: 2,
        roleLevel: 'lead',
        timezone: 'America/Mexico_City',
        motivations: ['Impacto Social', 'Innovación Tecnológica', 'Empoderar a mujeres'],
        links: [
            { title: 'Artículo en "Forbes 30 Under 30"', url: 'https://forbes.com/profile/maria-hernandez' }
        ]
    },
];

export const mockCurrentUserMentee: Mentee = {
    id: 101,
    name: 'Ana Torres',
    avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/55.jpg',
    title: 'Estudiante de Ciencias de la Computación',
    company: 'Universidad Nacional',
    bio: 'Soy una estudiante apasionada por la tecnología y el impacto social. Estoy buscando orientación para mi carrera en el desarrollo de software y me encantaría aprender de una profesional con experiencia.',
    expertise: ['JavaScript', 'React', 'Node.js'],
    mentorshipGoals: ['Orientación profesional', 'Revisión de CV/Portafolio', 'Desarrollo de habilidades técnicas'],
    pronouns: 'Ella',
    neurodivergence: 'TDAH',
    availability: generateAvailability(0, 14),
    roleLevel: 'entry',
    timezone: 'America/Mexico_City',
    motivations: ['Crecer profesionalmente', 'Construir mi red', 'Impacto Social'],
};

export const mockCurrentMentor: Mentor = mockMentors[0];
export const mockMentee: Mentee = mockCurrentUserMentee;

export const mockConnectionRequests: ConnectionRequest[] = [
    {
        id: 1001,
        mentor: mockMentors[0],
        mentee: {
            id: 102,
            name: 'Laura Gomez',
            avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/60.jpg',
            bio: 'Interesada en la ciencia de datos.',
            expertise: ['Python', 'SQL'],
            mentorshipGoals: ['Orientación profesional'],
            availability: {},
        },
        status: 'pending',
        motivationLetter: '**Temas de Interés:**\n- Ciencia de Datos, Machine Learning\n\n**Objetivos:**\n- Orientación profesional\n\n**Mensaje Adicional:**\nHola Dra. Rodriguez, admiro mucho su trabajo en Innovate AI y me encantaría aprender de su experiencia.'
    },
    {
        id: 1002,
        mentor: mockMentors[1],
        mentee: {
            id: 103,
            name: 'Carla Diaz',
            avatarUrl: 'https://xsgames.co/randomusers/assets/avatars/female/65.jpg',
            bio: 'Estudiante de diseño.',
            expertise: ['Figma', 'Adobe XD'],
            mentorshipGoals: ['Revisión de CV/Portafolio'],
            availability: {},
        },
        status: 'accepted',
        motivationLetter: 'Solicitud de conexión para revisión de portafolio.'
    }
];

export const mockMentorships: Mentorship[] = [
    {
        id: 1,
        mentor: mockMentors[1],
        mentee: mockCurrentUserMentee,
        status: 'active',
        startDate: '2023-10-01',
        sessions: [
            { id: 101, sessionNumber: 1, date: '2023-10-15', time: '10:00', duration: 60, status: 'completed', topic: 'Revisión de Portafolio Inicial', menteeGoals: 'Obtener feedback sobre mis proyectos actuales.', rating: 5, feedback: '¡Sofia fue increíblemente útil!', mentorSurvey: { preparation: 'excellent', engagement: 'excellent', outcome: 'Definimos una estrategia clara para mejorar su portafolio.' }, attachments: [{ name: 'Portfolio_Review_v1.pdf', url: '#' }] },
            { id: 102, sessionNumber: 2, date: '2023-11-05', time: '11:30', duration: 60, status: 'confirmed', topic: 'Profundizando en un Caso de Estudio', menteeGoals: 'Mejorar la narrativa de mi proyecto principal.', attachments: [{ name: 'Case_Study_UX.fig', url: '#' }] }
        ]
    },
    {
        id: 2,
        mentor: mockMentors[2],
        mentee: { ...mockCurrentUserMentee, id: 104, name: 'Valentina Morales' },
        status: 'completed',
        startDate: '2023-08-15',
        sessions: [
            { id: 201, sessionNumber: 1, date: '2023-08-22', time: '14:00', duration: 60, status: 'completed', topic: 'Intro a Arquitectura', menteeGoals: 'Entender conceptos básicos.', rating: 5, feedback: 'Muy claro' },
            { id: 202, sessionNumber: 2, date: '2023-09-05', time: '14:00', duration: 60, status: 'completed', topic: 'Revisión de Código', menteeGoals: 'Feedback en mi proyecto.', rating: 4, feedback: 'Útil' },
            { id: 203, sessionNumber: 3, date: '2023-09-19', time: '14:00', duration: 60, status: 'completed', topic: 'Plan de Carrera', menteeGoals: 'Definir próximos pasos.', rating: 5, feedback: 'Inspirador' }
        ]
    },
    {
        id: 3,
        mentor: mockMentors[0],
        mentee: { ...mockCurrentUserMentee, id: 105, name: 'Camila Rojas', title: 'Estudiante de Ciencias de la Computación' },
        status: 'active',
        startDate: '2023-11-01',
        sessions: [
             { id: 301, sessionNumber: 1, date: '2023-11-10', time: '14:00', duration: 60, status: 'completed', topic: 'Introducción a Machine Learning', menteeGoals: 'Entender conceptos básicos.', attachments: [{ name: 'ML_Fundamentals.pdf', url: '#' }, { name: 'Python_Cheatsheet.pdf', url: '#' }] }
        ]
    }
];

export const mockPendingSessions: Session[] = [
    {
        id: 901,
        sessionNumber: 1,
        mentor: mockMentors[0],
        mentee: mockCurrentUserMentee,
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '14:00',
        duration: 60,
        status: 'pending',
        topic: 'Discusión de Carrera en IA',
        menteeGoals: 'Quiero entender las diferentes rutas profesionales en el campo de la inteligencia artificial.'
    },
     {
        id: 902,
        sessionNumber: 1,
        mentor: mockMentors[3],
        mentee: mockCurrentUserMentee,
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '09:00',
        duration: 60,
        status: 'needs_confirmation',
        topic: 'Validación de Idea de Negocio',
        menteeGoals: 'Recibir feedback sobre una idea de startup en la que estoy trabajando.'
    }
];
