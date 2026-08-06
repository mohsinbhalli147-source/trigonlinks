import express from 'express';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { PackagesRepository } from '../repositories/PackagesRepository';
import { cache } from '../utils/cache';

const router = express.Router();
const packagesRepo = new PackagesRepository();

// Apply authentication to all routes
router.use(authenticate);

// Get all packages (admin and staff can view)
router.get('/', authorize('admin', 'staff'), async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await packagesRepo.paginatePackages({
      page: pageNum,
      limit: limitNum,
      status: status as any,
      search: search as string,
    });

    res.json(result);
  } catch (error) {
    logger.error('Get packages error:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Get single package (admin and staff can view)
router.get('/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const pkg = await packagesRepo.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// Create package (admin only)
router.post('/', authorize('admin'), [
  body('name').notEmpty(),
  body('speed').notEmpty(),
  body('price').isNumeric(),
], async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const packageData = {
      name: req.body.name,
      speed: req.body.speed,
      price: Number(req.body.price),
      description: req.body.description,
      status: req.body.status || 'active',
      created_at: Date.now(),
      created_by: req.user?.uid,
    };
    
    const pkg = await packagesRepo.createPackage(packageData);
    
    // Invalidate packages cache
    cache.deletePattern(/^packages:/);
    
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Update package (admin only)
router.put('/:id', authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: Date.now(),
      updated_by: req.user?.uid,
    };
    
    const pkg = await packagesRepo.updatePackage(req.params.id, updateData);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    // Invalidate packages cache
    cache.deletePattern(/^packages:/);
    
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// Delete package (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const deleted = await packagesRepo.deletePackage(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    // Invalidate packages cache
    cache.deletePattern(/^packages:/);
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

export default router;

