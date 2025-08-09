'use client';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { useState } from 'react';

const TestLightboxPage = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <h1>Test Lightbox Page</h1>
      <button onClick={() => setIsOpen(true)}>Open Lightbox</button>
      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        slides={[
          { src: "https://via.placeholder.com/150" },
          { src: "https://via.placeholder.com/200" }
        ]}
      />
    </div>
  );
};

export default TestLightboxPage;
