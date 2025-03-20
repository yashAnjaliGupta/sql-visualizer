import React from 'react';
import {codeToAst,sqlAstToGraph,getAllTableNodesAsTableNodes} from '../parser/parser';

interface ASTDisplayBoxProps {
    input: string;
}

const ASTDisplayBox: React.FC<ASTDisplayBoxProps> = ({ input }) => {
    const ast = codeToAst(input);
    // console.log(ast);
    // const g=sqlAstToGraph(ast);
    // // console.log(JSON.stringify(g, null, 2));
    // const temp=getAllTableNodesAsTableNodes(g);
    // console.log(temp);
    return (
        <div style={{ width: '25vw', height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black' }}>
            <pre style={{ width: '100%', whiteSpace: 'pre', overflow: 'auto' }}>{ast}</pre>
        </div>
    );
};

export default ASTDisplayBox;
