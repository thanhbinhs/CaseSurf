import React from 'react';
import styled from 'styled-components';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
}

const Buttonv1: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <StyledWrapper>
      <button onClick={onClick}>{children}</button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
   --border-radius: 15px;
   --border-width: 4px;
   appearance: none;
   position: relative;
   padding: 0.5em 1.5em;
   border: 0;
   cursor: pointer;
   /* --- CHANGE: Updated background to white --- */
   background-color: #fff;
   font-family: "Roboto", Arial, "Segoe UI", sans-serif;
   font-size: 18px;
   font-weight: 500; /* Increased font-weight for better readability */
   /* --- CHANGE: Updated text color to dark grey --- */
   color: #374151;
   z-index: 2;
   cursor: pointer;
  }

  button::after {
   --m-i: linear-gradient(#000, #000);
   --m-o: content-box, padding-box;
   content: "";
   position: absolute;
   left: 0;
   top: 0;
   width: 100%;
   height: 100%;
   padding: var(--border-width);
   border-radius: var(--border-radius);
   background-image: conic-gradient(
        #488cfb,
        #29dbbc,
        #ddf505,
        #ff9f0e,
        #e440bb,
        #655adc,
        #488cfb
    );
   -webkit-mask-image: var(--m-i), var(--m-i);
   mask-image: var(--m-i), var(--m-i);
   -webkit-mask-origin: var(--m-o);
   mask-origin: var(--m-o);
   -webkit-mask-clip: var(--m-o);
   mask-composite: exclude;
   -webkit-mask-composite: destination-out;
   filter: hue-rotate(0);
   animation: rotate-hue linear 500ms infinite;
   animation-play-state: paused;
  }

  button:hover::after {
   animation-play-state: running;
  }

  @keyframes rotate-hue {
   to {
    filter: hue-rotate(1turn);
   }
  }

  button,
  button::after {
   box-sizing: border-box;
  }

  button:active {
   --border-width: 5px;
  }`;

export default Buttonv1;
