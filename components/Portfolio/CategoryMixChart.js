'use client';

import React, { useState } from 'react';
import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    Sector 
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CategoryMixChart({ data, totalWeight }) {
    const [activeHoverIndex, setActiveHoverIndex] = useState(null);

    if (!data || data.length === 0) {
        return (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                No allocation data available
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius="100%"
                        paddingAngle={1}
                        dataKey="value"
                        nameKey="name"
                        stroke="#020617"
                        strokeWidth={3}
                        animationDuration={800}
                        animationBegin={0}
                        activeIndex={activeHoverIndex}
                        activeShape={(props) => {
                            const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                            const RADIAN = Math.PI / 180;
                            const offset = 12;
                            const sin = Math.sin(-RADIAN * midAngle);
                            const cos = Math.cos(-RADIAN * midAngle);
                            const nx = cx + offset * cos;
                            const ny = cy + offset * sin;
                            return (
                                <g>
                                    <Sector
                                        cx={nx}
                                        cy={ny}
                                        innerRadius={innerRadius}
                                        outerRadius={outerRadius + 8}
                                        startAngle={startAngle}
                                        endAngle={endAngle}
                                        fill={fill}
                                        stroke="rgba(255,255,255,0.4)"
                                        strokeWidth={2}
                                    />
                                    <Sector
                                        cx={nx}
                                        cy={ny}
                                        startAngle={startAngle}
                                        endAngle={endAngle}
                                        innerRadius={outerRadius + 8}
                                        outerRadius={outerRadius + 11}
                                        fill={fill}
                                        opacity={0.3}
                                    />
                                </g>
                            );
                        }}
                        onMouseEnter={(_, index) => setActiveHoverIndex(index)}
                        onMouseLeave={() => setActiveHoverIndex(null)}
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                                style={{ 
                                    cursor: 'pointer', 
                                    outline: 'none' 
                                }}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div style={{ 
                                        background: '#0b1222', 
                                        backdropFilter: 'blur(12px)', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        padding: '16px', 
                                        borderRadius: '12px', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                                    }}>
                                        <p style={{ fontSize: '10px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>{payload[0].name}</p>
                                        <div style={{ height: '2px', width: '24px', backgroundColor: '#6366f1', marginBottom: '12px' }}></div>
                                        <p style={{ fontSize: '20px', fontWeight: '900', color: '#f8fafc' }}>
                                            {totalWeight > 0 ? ((payload[0].value * 100 / totalWeight).toFixed(1)) : payload[0].value.toFixed(1)}%
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
