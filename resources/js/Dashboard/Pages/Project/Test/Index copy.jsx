// Best Approach: Update state, let AG Grid react to changes
import { useState, useEffect, useRef, useCallback } from "react";
import {
    AgGridReact,
    gridTheme,
    defaultColDef,
    sideBarConfig,
    gridOptionsConfig,
} from "@agConfig/AgGridConfig";
import axios from "axios";

const Index = ({ projects }) => {
    const [rowData, setRowData] = useState(() => 
        (projects || []).map(p => ({ 
            ...p, 
            team_members: [],
            _teamLoaded: false 
        }))
    );
    
    const gridRef = useRef();
    
    // Function to update team members for a project
    const updateProjectTeam = useCallback((projectId, teamMembers) => {
        setRowData(prev => prev.map(project => 
            project.id === projectId 
                ? { ...project, team_members: teamMembers, _teamLoaded: true }
                : project
        ));
    }, []);
    
    useEffect(() => {
        const loadTeams = async () => {
            if (rowData.length === 0) return;
            
            const projectIds = rowData.map(p => p.id);
            
            try {
                const response = await axios.post('/api/test/team-members', {
                    project_ids: projectIds
                });
                
                const teamData = response.data.team_members || {};
                
                // Update each project's team in state
                rowData.forEach(project => {
                    const teams = teamData[project.id] || [];
                    updateProjectTeam(project.id, teams);
                });
                
            } catch (error) {
                console.error('Error loading teams:', error);
            }
        };
        
        setTimeout(loadTeams, 500);
    }, [rowData, updateProjectTeam]);

    const columnDefs = [
        {
            headerName: "Project",
            field: "project_title",
            width: 200
        },
        {
            headerName: "Address",
            field: "project_address",
            width: 300,
            cellRenderer: (params) => {
                if (!params.value) return "N/A";
                const div = document.createElement("div");
                div.innerHTML = params.value;
                return div.textContent?.substring(0, 100) || "";
            }
        },
        {
            headerName: "Team",
            field: "team_members",
            width: 200,
            cellRenderer: (params) => {
                if (!params.data._teamLoaded) {
                    return <span className="text-warning">Loading...</span>;
                }
                
                const members = params.data.team_members || [];
                if (members.length === 0) return <span className="text-muted">No team</span>;
                
                return members.map(m => m.name?.split(' ')[0]).join(', ');
            }
        }
    ];

    return (
        <div className="p-3">
            <h4>Projects</h4>
            <div className="ag-theme-alpine" style={{ height: '400px' }}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    getRowId={(params) => params.data.id.toString()}
                />
            </div>
        </div>
    );
};

export default Index;