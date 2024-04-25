import React, { useState } from 'react';

const DummyComp: React.FC = () => {
  const [files,] = useState([
    { id: 1, name: 'example1.txt', size: '14KB' },
    { id: 2, name: 'report.pdf', size: '120KB' },
    { id: 3, name: 'image.png', size: '2MB' }
  ]);

  return (
    <div>
      <h1>File List</h1>
      <ul>
        {files.map(file => (
          <li key={file.id}>
            {file.name} - {file.size}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DummyComp;