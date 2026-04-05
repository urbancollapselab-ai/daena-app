import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Brain, Database, LineChart, Code, Building, Map, ShoppingCart, TestTube2, MessageSquare } from 'lucide-react';

const iconMap = {
  main_brain: Brain,
  finance: LineChart,
  data: Database,
  marketing: Map,
  sales: ShoppingCart,
  research: TestTube2,
  coordinator: Building,
  terminal: Code
};

// Custom Node to look totally sci-fi / premium
const AgentNode = ({ data, selected }: { data: any, selected: boolean }) => {
  const Icon = iconMap[data.id as keyof typeof iconMap] || MessageSquare;
  const isActive = data.status === 'active';
  
  return (
    <div className={`px-4 py-3 rounded-xl border-2 backdrop-blur-md transition-all duration-300 ${
      isActive 
        ? 'bg-emerald-950/80 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
        : 'bg-neutral-900/80 border-neutral-800'
    } ${selected ? 'ring-2 ring-white' : ''}`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className={`font-bold text-sm ${isActive ? 'text-white' : 'text-neutral-300'}`}>{data.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">{isActive ? 'İşlem Başında' : 'Beklemede'}</div>
        </div>
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
        )}
      </div>
      {/* Node output handlers for react flow would be here in a full generic implementation */}
    </div>
  );
};

const nodeTypes = {
  agentNode: AgentNode,
};

const initialNodes = [
  { id: '1', type: 'agentNode', position: { x: 250, y: 50 }, data: { id: 'main_brain', name: 'Main Brain', status: 'active' } },
  { id: '2', type: 'agentNode', position: { x: 50, y: 200 }, data: { id: 'research', name: 'Research', status: 'idle' } },
  { id: '3', type: 'agentNode', position: { x: 250, y: 200 }, data: { id: 'finance', name: 'Finance', status: 'idle' } },
  { id: '4', type: 'agentNode', position: { x: 450, y: 200 }, data: { id: 'data', name: 'Data Center', status: 'idle' } },
  { id: '5', type: 'agentNode', position: { x: 150, y: 350 }, data: { id: 'terminal', name: 'Terminal / Claude', status: 'idle' } },
  { id: '6', type: 'agentNode', position: { x: 350, y: 350 }, data: { id: 'coordinator', name: 'DAG Planner', status: 'idle' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e1-3', source: '1', target: '3', style: { stroke: '#3f3f46', strokeWidth: 1 } },
  { id: 'e1-4', source: '1', target: '4', style: { stroke: '#3f3f46', strokeWidth: 1 } },
  { id: 'e2-5', source: '2', target: '5', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e3-6', source: '3', target: '6', style: { stroke: '#3f3f46', strokeWidth: 1 } },
];

export const SystemMonitor = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-full bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-neutral-900/80 backdrop-blur px-4 py-2 rounded-full border border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center shadow-lg">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" />
        CANLI SİSTEM HARİTASI
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#10b981" variant={BackgroundVariant.Dots} gap={24} size={1} className="opacity-20" />
        <Controls className="bg-neutral-900 border border-neutral-800 fill-white" />
      </ReactFlow>
    </div>
  );
};
