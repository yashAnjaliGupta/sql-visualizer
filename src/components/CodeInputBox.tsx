import React, { useState } from 'react';

interface CodeInputBoxProps {
    onSubmit: (input: string) => void;
    inputValue: string;
}

const CodeInputBox: React.FC<CodeInputBoxProps> = ({ onSubmit,inputValue }) => {
    const [input, setInput] = useState(inputValue);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(input);
    };

    return (
        <div style={{ width: '25vw', height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <form onSubmit={handleSubmit} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    style={{ width: '90%', height: '70%', marginBottom: '10px' }} 
                />
                <button type="submit" style={{ width: '90%', height: '20%' }}>Submit</button>
            </form>
        </div>
    );
};

export default CodeInputBox;
