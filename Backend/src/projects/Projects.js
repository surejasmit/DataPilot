const getProjects = async (req, res, pool) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT p.*,
        u.name as owner_name,
        u.email as owner_email
       FROM projects p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1
       ORDER BY p.updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

const getProjectById = async (req, res, pool) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    
    const result = await pool.query(
      `SELECT p.*, 
        u.name as owner_name,
        u.email as owner_email
       FROM projects p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [projectId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

const createProject = async (req, res, pool) => {
  try {
    const userId = req.user.id;
    const { name, description, dataset_name, dataset_path, dataset_size, dataset_rows, dataset_columns } = req.body;
    
    console.log('Create project request:', { userId, name, description, dataset_name, dataset_path, dataset_size, dataset_rows, dataset_columns });
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    const result = await pool.query(
      `INSERT INTO projects (user_id, name, description, dataset_name, dataset_path, dataset_size, dataset_rows, dataset_columns, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
       RETURNING *`,
      [userId, name, description, dataset_name, dataset_path, dataset_size, dataset_rows, dataset_columns]
    );
    
    console.log('Project created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create project error:', err);
    console.error('Error details:', err.message, err.code, err.stack);
    res.status(500).json({ error: 'Failed to create project', details: err.message });
  }
};

const updateProject = async (req, res, pool) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { name, description, dataset_name, dataset_path, dataset_size, dataset_rows, dataset_columns, status, favorite } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (dataset_name !== undefined) {
      updates.push(`dataset_name = $${paramIndex++}`);
      values.push(dataset_name);
    }
    if (dataset_path !== undefined) {
      updates.push(`dataset_path = $${paramIndex++}`);
      values.push(dataset_path);
    }
    if (dataset_size !== undefined) {
      updates.push(`dataset_size = $${paramIndex++}`);
      values.push(dataset_size);
    }
    if (dataset_rows !== undefined) {
      updates.push(`dataset_rows = $${paramIndex++}`);
      values.push(dataset_rows);
    }
    if (dataset_columns !== undefined) {
      updates.push(`dataset_columns = $${paramIndex++}`);
      values.push(dataset_columns);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (favorite !== undefined) {
      updates.push(`favorite = $${paramIndex++}`);
      values.push(favorite);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(projectId, userId);
    
    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

const deleteProject = async (req, res, pool) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const projectResult = await pool.query(
      'SELECT dataset_path FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectResult.rows.length > 0 && projectResult.rows[0].dataset_path) {
      const fs = require('fs');
      const path = require('path');
      try {
        const filePath = path.resolve(projectResult.rows[0].dataset_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        // File cleanup is best-effort
      }
    }

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [projectId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

const toggleFavorite = async (req, res, pool) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    
    const result = await pool.query(
      `UPDATE projects SET favorite = NOT favorite, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [projectId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  toggleFavorite,
};