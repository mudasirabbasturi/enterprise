import { useState, useEffect, useRef, useCallback } from "react";
import {
    AgGridReact,
    defaultColDef,
} from "@agConfig/AgGridConfig";
import axios from "axios";

const Index = ({ projects: initialProjects, totalProjects }) => {
    // State
    const [rowData, setRowData] = useState(() => 
        (initialProjects || []).map(p => ({ 
            ...p, 
            team_members: [],
            _teamLoaded: false 
        }))
    );
    
    const [loading, setLoading] = useState({
        projects: false,
        teams: false
    });
    
    const [hasMore, setHasMore] = useState(true);
    const [loadedCount, setLoadedCount] = useState(initialProjects?.length || 0);
    const [teamsLoadedCount, setTeamsLoadedCount] = useState(0);
    
    const gridRef = useRef();
    const isFetching = useRef(false);
    const loadQueue = useRef(new Set());

    // Function to load team members for specific projects
    const loadTeamMembers = useCallback(async (projectIds) => {
        if (projectIds.length === 0) return;
        
        setLoading(prev => ({ ...prev, teams: true }));
        
        try {
            const response = await axios.post('/api/test/team-members', {
                project_ids: Array.from(projectIds)
            });
            
            if (response.data.success) {
                const teamData = response.data.team_members || {};
                
                // Update row data with team members
                setRowData(prev => prev.map(project => {
                    if (teamData[project.id]) {
                        return { 
                            ...project, 
                            team_members: teamData[project.id], 
                            _teamLoaded: true 
                        };
                    }
                    return project;
                }));
                
                // Update teams loaded count
                setTeamsLoadedCount(prev => prev + Object.keys(teamData).length);
            }
            
            // Clear the queue
            loadQueue.current.clear();
            
        } catch (error) {
            console.error('Error loading team members:', error);
        } finally {
            setLoading(prev => ({ ...prev, teams: false }));
        }
    }, []);

    // Load team members for visible rows
    const loadVisibleTeams = useCallback(() => {
        const api = gridRef.current?.api;
        if (!api) return;

        const firstRow = api.getFirstDisplayedRow();
        const lastRow = api.getLastDisplayedRow();
        
        if (firstRow === null || lastRow === null) return;
        
        const visibleProjectIds = [];
        for (let i = firstRow; i <= lastRow; i++) {
            const rowNode = api.getRowNode(i);
            if (rowNode?.data && !rowNode.data._teamLoaded) {
                visibleProjectIds.push(rowNode.data.id);
            }
        }
        
        if (visibleProjectIds.length > 0) {
            loadTeamMembers(visibleProjectIds);
        }
    }, [loadTeamMembers]);

    // Load more projects
    const loadMoreProjects = useCallback(async () => {
        if (isFetching.current || !hasMore) return;
        
        isFetching.current = true;
        setLoading(prev => ({ ...prev, projects: true }));
        
        try {
            const response = await axios.post('/api/test/more-projects', {
                skip: loadedCount,
                take: 20 // Load 20 at a time
            });
            
            if (response.data.success) {
                const newProjects = response.data.projects.map(p => ({
                    ...p,
                    team_members: [],
                    _teamLoaded: false
                }));
                
                // Add new projects to the grid
                setRowData(prev => [...prev, ...newProjects]);
                setLoadedCount(prev => prev + newProjects.length);
                setHasMore(response.data.hasMore);
                
                // Load teams for the new projects after a short delay
                setTimeout(() => {
                    const newProjectIds = newProjects.map(p => p.id);
                    loadTeamMembers(newProjectIds);
                }, 100);
            }
            
        } catch (error) {
            console.error('Error loading more projects:', error);
        } finally {
            setLoading(prev => ({ ...prev, projects: false }));
            isFetching.current = false;
        }
    }, [loadedCount, hasMore, loadTeamMembers]);

    // Initial team load
    useEffect(() => {
        if (rowData.length > 0) {
            // Load teams for initial 20 projects
            const initialProjectIds = rowData.map(p => p.id);
            loadTeamMembers(initialProjectIds);
        }
    }, [rowData, loadTeamMembers]);

    // Setup scroll listener for infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const gridElement = document.querySelector('.ag-body-viewport');
            if (!gridElement) return;
            
            const { scrollTop, scrollHeight, clientHeight } = gridElement;
            const scrollBottom = scrollHeight - scrollTop - clientHeight;
            
            // Load more when 100px from bottom
            if (scrollBottom < 100 && !loading.projects && hasMore) {
                loadMoreProjects();
            }
        };
        
        const gridElement = document.querySelector('.ag-body-viewport');
        if (gridElement) {
            gridElement.addEventListener('scroll', handleScroll);
        }
        
        return () => {
            if (gridElement) {
                gridElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, [loading.projects, hasMore, loadMoreProjects]);

    // Auto-load teams when scrolling
    useEffect(() => {
        const debouncedLoadTeams = debounce(loadVisibleTeams, 300);
        
        const handleGridScroll = () => {
            debouncedLoadTeams();
        };
        
        const gridElement = document.querySelector('.ag-body-viewport');
        if (gridElement) {
            gridElement.addEventListener('scroll', handleGridScroll);
        }
        
        return () => {
            if (gridElement) {
                gridElement.removeEventListener('scroll', handleGridScroll);
            }
        };
    }, [loadVisibleTeams]);

    // Debounce helper function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Column definitions
    const columnDefs = [
        {
            headerName: "#",
            field: "id",
            width: 80,
            cellRenderer: (params) => {
                return (
                    <div className="d-flex align-items-center gap-2">
                        {params.value}
                        {!params.data._teamLoaded && (
                            <div className="spinner-border spinner-border-sm text-warning" 
                                 style={{ width: '10px', height: '10px' }}>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            headerName: "Project Title",
            field: "project_title",
            width: 250,
            cellRenderer: (params) => {
                return params.value || "N/A";
            }
        },
        {
            headerName: "Address",
            field: "project_address",
            width: 300,
            cellRenderer: (params) => {
                return params.value || "N/A";
            }
        },
        {
            headerName: "Team Members",
            field: "team_members",
            width: 200,
            cellRenderer: (params) => {
                const { _teamLoaded, team_members } = params.data;
                
                if (!_teamLoaded) {
                    return (
                        <div className="d-flex align-items-center">
                            <div className="spinner-grow spinner-grow-sm text-warning me-2"></div>
                            <small className="text-muted">Loading...</small>
                        </div>
                    );
                }
                
                if (team_members.length === 0) {
                    return <span className="text-muted">No team</span>;
                }
                
                return (
                    <div>
                        {team_members.slice(0, 2).map((member, index) => (
                            <div key={index} className="badge bg-primary me-1 mb-1">
                                {member.name}
                            </div>
                        ))}
                        {team_members.length > 2 && (
                            <span className="badge bg-secondary">
                                +{team_members.length - 2}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            headerName: "Status",
            width: 120,
            cellRenderer: (params) => {
                return params.data._teamLoaded ? (
                    <span className="badge bg-success">Loaded</span>
                ) : (
                    <span className="badge bg-warning">Pending</span>
                );
            }
        },
    ];

    return (
        <div className="p-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>
                    Progressive Loading Demo
                    <small className="text-muted ms-2">
                        (Projects: {loadedCount}/{totalProjects} | Teams: {teamsLoadedCount}/{loadedCount})
                    </small>
                </h4>
                
                <div className="d-flex align-items-center gap-3">
                    {loading.projects && (
                        <div className="d-flex align-items-center gap-2">
                            <div className="spinner-border spinner-border-sm text-primary"></div>
                            <small>Loading projects...</small>
                        </div>
                    )}
                    {loading.teams && (
                        <div className="d-flex align-items-center gap-2">
                            <div className="spinner-border spinner-border-sm text-warning"></div>
                            <small>Loading teams...</small>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Progress bar */}
            <div className="mb-3">
                <div className="d-flex align-items-center mb-1">
                    <small className="me-2">Projects:</small>
                    <div className="progress flex-grow-1" style={{ height: '6px' }}>
                        <div 
                            className="progress-bar" 
                            style={{ 
                                width: `${(loadedCount / totalProjects) * 100}%`
                            }}
                        ></div>
                    </div>
                    <small className="ms-2">{loadedCount}/{totalProjects}</small>
                </div>
            </div>
            
            {/* Grid */}
            <div className="ag-theme-alpine" style={{ height: '500px' }}>
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    getRowId={(params) => params.data.id.toString()}
                    rowBuffer={10}
                    pagination={false}
                    rowModelType="clientSide"
                    defaultColDef={{
                        ...defaultColDef,
                        sortable: true,
                        filter: true,
                        resizable: true,
                    }}
                />
            </div>
            
            {/* Loading indicator */}
            {loading.projects && (
                <div className="text-center mt-3">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2">Loading more projects...</p>
                </div>
            )}
            
            {/* Statistics and Controls */}
            <div className="mt-3 p-3 bg-light border rounded">
                <div className="row">
                    <div className="col-md-6">
                        <h6>Loading Statistics:</h6>
                        <ul className="mb-0">
                            <li>Projects loaded: {loadedCount} / {totalProjects}</li>
                            <li>Teams loaded: {teamsLoadedCount} / {loadedCount}</li>
                            <li>Loading projects: {loading.projects ? 'Yes' : 'No'}</li>
                            <li>Loading teams: {loading.teams ? 'Yes' : 'No'}</li>
                        </ul>
                    </div>
                    <div className="col-md-6">
                        <h6>Controls:</h6>
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-sm btn-primary"
                                onClick={loadMoreProjects}
                                disabled={loading.projects || !hasMore}
                            >
                                Load 20 More Projects
                            </button>
                            <button 
                                className="btn btn-sm btn-success"
                                onClick={loadVisibleTeams}
                                disabled={loading.teams}
                            >
                                Load Visible Teams
                            </button>
                            <button 
                                className="btn btn-sm btn-info"
                                onClick={() => {
                                    const allProjectIds = rowData
                                        .filter(p => !p._teamLoaded)
                                        .map(p => p.id);
                                    if (allProjectIds.length > 0) {
                                        loadTeamMembers(allProjectIds);
                                    }
                                }}
                                disabled={loading.teams}
                            >
                                Load All Teams
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Help text */}
            <div className="alert alert-info mt-3 p-2">
                <small>
                    <strong>How it works:</strong> 
                    <ul className="mb-0 mt-1">
                        <li>Initial 20 projects loaded automatically</li>
                        <li>Scroll down to load 20 more projects</li>
                        <li>Teams load automatically when projects are loaded</li>
                        <li>Use buttons to manually trigger team loading</li>
                    </ul>
                </small>
            </div>
        </div>
    );
};

export default Index;