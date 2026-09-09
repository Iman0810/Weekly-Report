import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

function ReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    week_start: '',
    week_end: '',
    project: null,
    tasks: [],
    blockers: [],
    achievements: [],
    hours_worked: {},
    notes: '',
  });

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: '',
    priority: 'MEDIUM',
    planned_percent: 100,
    actual_percent: 0,
    status: 'IN_PROGRESS',
    time_planned: 0,
    time_spent: 0,
    output: '',
  });

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects/');
      return response.data.results || response.data;
    },
  });

  // Fetch report if editing
  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await api.get(`/reports/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (report) {
      setFormData({
        week_start: report.week_start,
        week_end: report.week_end,
        project: report.project,
        tasks: report.tasks || [],
        blockers: report.blockers || [],
        achievements: report.achievements || [],
        hours_worked: report.hours_worked || {},
        notes: report.notes || '',
      });
      setTasks(report.tasks || []);
    }
  }, [report]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        week_start: data.week_start,
        week_end: data.week_end,
        project_id: data.project?.id || null,
        tasks: data.tasks || [],
        blockers: data.blockers || [],
        achievements: data.achievements || [],
        hours_worked: data.hours_worked || {},
        notes: data.notes || '',
        tasks_planned: data.tasks_planned || [],
      };

      console.log('Sending payload:', payload);

      if (isEditing) {
        if (report?.status === 'NEEDS_CORRECTION') {
          payload.status = 'DRAFT';
        }
        const response = await api.put(`/reports/${id}/`, payload);
        return response.data;
      } else {
        const response = await api.post('/reports/', payload);
        return response.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['reports']);
      if (isEditing && report?.status === 'NEEDS_CORRECTION') {
        alert('✅ Report updated and reset to DRAFT. You can now resubmit it.');
      } else {
        alert(isEditing ? '✅ Report updated successfully!' : '✅ Report created successfully!');
      }
      navigate('/reports');
    },
    onError: (error) => {
      console.error('Error saving report:', error);
      alert('❌ Failed to save report. Check console for details.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      tasks: tasks,
    };
    mutation.mutate(data);
  };

  const addTask = () => {
    if (newTask.name.trim()) {
      setTasks([...tasks, { ...newTask }]);
      setNewTask({
        name: '',
        priority: 'MEDIUM',
        planned_percent: 100,
        actual_percent: 0,
        status: 'IN_PROGRESS',
        time_planned: 0,
        time_spent: 0,
        output: '',
      });
    }
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  if (isLoading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <h2>{isEditing ? 'Edit Report' : 'Create New Report'}</h2>

      {report?.status === 'NEEDS_CORRECTION' && (
        <div className="alert alert-warning">
          <strong>⚠️ Manager's Feedback:</strong>
          <p className="mb-0">{report.manager_comment}</p>
          <p className="mb-0 mt-2 small">Editing this report will reset it to DRAFT so you can resubmit.</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Week Start</label>
            <input
              type="date"
              className="form-control"
              value={formData.week_start}
              onChange={(e) => setFormData({ ...formData, week_start: e.target.value })}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Week End</label>
            <input
              type="date"
              className="form-control"
              value={formData.week_end}
              onChange={(e) => setFormData({ ...formData, week_end: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Project</label>
          <select
            className="form-select"
            value={formData.project?.id || ''}
            onChange={(e) => {
              const project = projects?.find(p => p.id === parseInt(e.target.value));
              setFormData({ ...formData, project: project || null });
            }}
          >
            <option value="">Select Project</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tasks Section */}
        <div className="card mb-3">
          <div className="card-header">
            <h5 className="mb-0">Tasks</h5>
          </div>
          <div className="card-body">
            {/* Add Task Form */}
            <div className="row g-2 mb-3">
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Task name"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Planned %"
                  value={newTask.planned_percent}
                  onChange={(e) => setNewTask({ ...newTask, planned_percent: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Actual %"
                  value={newTask.actual_percent}
                  onChange={(e) => setNewTask({ ...newTask, actual_percent: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="col-md-3">
                <button type="button" className="btn btn-primary w-100" onClick={addTask}>
                  Add Task
                </button>
              </div>
            </div>

            {/* Tasks List */}
            {tasks.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Planned %</th>
                      <th>Actual %</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, index) => (
                      <tr key={index}>
                        <td>{task.name}</td>
                        <td><span className={`badge bg-${task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning text-dark' : 'info'}`}>{task.priority}</span></td>
                        <td>{task.planned_percent}%</td>
                        <td>{task.actual_percent}%</td>
                        <td>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => removeTask(index)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted">No tasks added yet.</p>
            )}
          </div>
        </div>

        {/* Blockers */}
        <div className="mb-3">
          <label className="form-label">Blockers (one per line)</label>
          <textarea
            className="form-control"
            rows="2"
            placeholder="List any blockers (one per line)"
            value={formData.blockers.map(b => b.description).join('\n')}
            onChange={(e) => {
              const blockers = e.target.value.split('\n').filter(b => b.trim()).map(b => ({
                description: b,
                is_key: false,
              }));
              setFormData({ ...formData, blockers });
            }}
          />
        </div>

        {/* Achievements */}
        <div className="mb-3">
          <label className="form-label">Achievements (one per line)</label>
          <textarea
            className="form-control"
            rows="2"
            placeholder="List your achievements (one per line)"
            value={formData.achievements.map(a => a.description).join('\n')}
            onChange={(e) => {
              const achievements = e.target.value.split('\n').filter(a => a.trim()).map(a => ({
                description: a,
                is_key: false,
              }));
              setFormData({ ...formData, achievements });
            }}
          />
        </div>

        {/* Hours Worked */}
        <div className="mb-3">
          <label className="form-label">Hours Worked by Task Type</label>
          <div className="row">
            {['Development', 'Testing', 'Meetings', 'Documentation'].map((type) => (
              <div className="col-md-3" key={type}>
                <label className="form-label small">{type}</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.hours_worked[type] || ''}
                  onChange={(e) => {
                    const hours = { ...formData.hours_worked };
                    hours[type] = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, hours_worked: hours });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Tasks Planned for Next Week */}
        <div className="mb-3">
          <label className="form-label">📅 Tasks Planned for Next Week</label>
          <textarea
            className="form-control"
            rows="2"
            placeholder="List tasks planned for next week (one per line)"
            value={formData.tasks_planned?.map(t => t.name).join('\n') || ''}
            onChange={(e) => {
              const tasks = e.target.value.split('\n').filter(t => t.trim()).map(t => ({
                name: t,
                priority: 'MEDIUM',
              }));
              setFormData({ ...formData, tasks_planned: tasks });
            }}
          />
          <small className="text-muted">Enter one task per line</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>
          {mutation.isLoading ? 'Saving...' : isEditing ? 'Update Report' : 'Create Report'}
        </button>
        <Link to="/reports" className="btn btn-secondary ms-2">Cancel</Link>
      </form>
    </div>
  );
}

export default ReportForm;