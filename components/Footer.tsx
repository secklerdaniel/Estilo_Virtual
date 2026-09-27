import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-6 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Estilo Virtual. Todos os direitos reservados.</p>
        <p className="text-sm mt-2">
          Desenvolvido com ❤️ por <a href="https://instagram.com/secklerdigital" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Seckler Digital</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;