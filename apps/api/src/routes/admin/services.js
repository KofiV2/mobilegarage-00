const express = require('express');
const { adminAuth } = require('../../middleware/auth');
const { supabaseAdmin } = require('../../config/supabase');

const router = express.Router();

/**
 * @swagger
 * /api/admin/services:
 *   get:
 *     tags: [Admin - Services]
 *     summary: Get all services
 *     description: Fetch all services with statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [basic, premium, deluxe, specialty]
 *         description: Filter by category
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records per page (max 100)
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', adminAuth, async (req, res) => {
  try {
    const { category, active } = req.query;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('services')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply active filter
    if (active !== undefined) {
      const isActive = active === 'true';
      query = query.eq('is_active', isActive);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: services, error, count } = await query;

    if (error) throw error;

    // Use database fields instead of calculating (much faster)
    // total_bookings and total_revenue should already be in the services table
    const servicesWithStats = services.map(service => ({
      ...service,
      stats: {
        totalBookings: service.total_bookings || 0,
        totalRevenue: service.total_revenue || 0
      }
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      services: servicesWithStats,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      error: 'Failed to fetch services',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/services/{id}:
 *   get:
 *     tags: [Admin - Services]
 *     summary: Get service by ID
 *     description: Fetch detailed information about a specific service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details retrieved successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: service, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Service not found' });
      }
      throw error;
    }

    res.json(service);

  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      error: 'Failed to fetch service',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/services:
 *   post:
 *     tags: [Admin - Services]
 *     summary: Create new service
 *     description: Add a new service to the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - basePrice
 *               - duration
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               duration:
 *                 type: number
 *                 description: Duration in minutes
 *               category:
 *                 type: string
 *                 enum: [basic, premium, deluxe, specialty]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, basePrice, duration, category, features, imageUrl } = req.body;

    // Validation
    if (!name || !description || !basePrice || !duration || !category) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, description, basePrice, duration, and category are required'
      });
    }

    const newService = {
      name,
      description,
      base_price: basePrice,
      duration,
      category,
      features: features || [],
      image_url: imageUrl || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: service, error } = await supabaseAdmin
      .from('services')
      .insert([newService])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Service created successfully',
      service
    });

  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      error: 'Failed to create service',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/services/{id}:
 *   put:
 *     tags: [Admin - Services]
 *     summary: Update service
 *     description: Update an existing service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               duration:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [basic, premium, deluxe, specialty]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, duration, category, features, imageUrl } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (name) updates.name = name;
    if (description) updates.description = description;
    if (basePrice !== undefined) updates.base_price = basePrice;
    if (duration) updates.duration = duration;
    if (category) updates.category = category;
    if (features) updates.features = features;
    if (imageUrl !== undefined) updates.image_url = imageUrl;

    const { data: service, error } = await supabaseAdmin
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Service not found' });
      }
      throw error;
    }

    res.json({
      message: 'Service updated successfully',
      service
    });

  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      error: 'Failed to update service',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/services/{id}:
 *   delete:
 *     tags: [Admin - Services]
 *     summary: Delete service
 *     description: Permanently delete a service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const { data: existingService } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if service has bookings
    const { count: bookingCount } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', id);

    if (bookingCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete service with existing bookings',
        message: `This service has ${bookingCount} booking(s). Consider deactivating instead.`
      });
    }

    // Delete service
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      error: 'Failed to delete service',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/services/{id}/toggle-status:
 *   put:
 *     tags: [Admin - Services]
 *     summary: Toggle service active status
 *     description: Activate or deactivate a service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service status toggled successfully
 *       404:
 *         description: Service not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const { data: currentService, error: fetchError } = await supabaseAdmin
      .from('services')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Service not found' });
      }
      throw fetchError;
    }

    // Toggle status
    const newStatus = !currentService.is_active;

    const { data: service, error: updateError } = await supabaseAdmin
      .from('services')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      message: `Service ${newStatus ? 'activated' : 'deactivated'} successfully`,
      service
    });

  } catch (error) {
    console.error('Error toggling service status:', error);
    res.status(500).json({
      error: 'Failed to toggle service status',
      message: error.message
    });
  }
});

module.exports = router;
