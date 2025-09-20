import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { eq, ilike, and, gte, lte, sql } from 'drizzle-orm';

import { db, sweets, purchases, type NewSweet, type NewPurchase } from '../db';

// Get all sweets
export const getAllSweets = async (req: Request, res: Response) => {
  try {
    const allSweets = await db.select().from(sweets);

    res.status(200).json({
      success: true,
      sweets: allSweets,
    });
  } catch (error) {
    console.error('Get all sweets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create new sweet
export const createSweet = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, category, price, quantity, description } = req.body;

    // Check for duplicate name
    const existingSweet = await db.select().from(sweets).where(eq(sweets.name, name));
    if (existingSweet.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Sweet with name '${name}' already exists`,
      });
    }

    const newSweet: NewSweet = {
      name,
      category,
      price,
      quantity: quantity || 0,
      description,
    };

    const [createdSweet] = await db.insert(sweets).values(newSweet).returning();

    res.status(201).json({
      success: true,
      sweet: createdSweet,
    });
  } catch (error) {
    console.error('Create sweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Search sweets
export const searchSweets = async (req: Request, res: Response) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;

    // Validate price parameters
    if (minPrice && isNaN(Number(minPrice))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid minPrice parameter',
      });
    }

    if (maxPrice && isNaN(Number(maxPrice))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid maxPrice parameter',
      });
    }

    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price range: minimum price cannot be greater than maximum price',
      });
    }

    const conditions = [];

    // Case-insensitive substring search for name (ILIKE)
    if (name && typeof name === 'string') {
      conditions.push(ilike(sweets.name, `%${name}%`));
    }

    // Exact category match
    if (category && typeof category === 'string') {
      conditions.push(eq(sweets.category, category));
    }

    // Price range filtering
    if (minPrice) {
      conditions.push(gte(sweets.price, String(minPrice)));
    }

    if (maxPrice) {
      conditions.push(lte(sweets.price, String(maxPrice)));
    }

    let searchResults;
    if (conditions.length > 0) {
      searchResults = await db
        .select()
        .from(sweets)
        .where(and(...conditions));
    } else {
      searchResults = await db.select().from(sweets);
    }

    res.status(200).json({
      success: true,
      sweets: searchResults,
    });
  } catch (error) {
    console.error('Search sweets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update sweet
export const updateSweet = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove undefined fields
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
      });
    }

    filteredUpdateData.updatedAt = new Date();

    const [updatedSweet] = await db
      .update(sweets)
      .set(filteredUpdateData)
      .where(eq(sweets.id, id))
      .returning();

    if (!updatedSweet) {
      return res.status(404).json({
        success: false,
        message: 'Sweet not found',
      });
    }

    res.status(200).json({
      success: true,
      sweet: updatedSweet,
    });
  } catch (error) {
    console.error('Update sweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete sweet (Admin only)
export const deleteSweet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [deletedSweet] = await db.delete(sweets).where(eq(sweets.id, id)).returning();

    if (!deletedSweet) {
      return res.status(404).json({
        success: false,
        message: 'Sweet not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sweet deleted successfully',
    });
  } catch (error) {
    console.error('Delete sweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Purchase sweet
export const purchaseSweet = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user!.id;

    // Get sweet details for price calculation
    const [sweet] = await db.select().from(sweets).where(eq(sweets.id, id)).limit(1);

    if (!sweet) {
      return res.status(404).json({
        success: false,
        message: 'Sweet not found',
      });
    }

    // Calculate total price
    const totalPrice = (parseFloat(sweet.price) * quantity).toFixed(2);

    // Atomic stock update with concurrency protection
    // UPDATE sweets SET quantity = quantity - $1 WHERE id=$2 AND quantity >= $1 RETURNING *
    const [updatedSweet] = await db
      .update(sweets)
      .set({
        quantity: sql`${sweets.quantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(and(eq(sweets.id, id), gte(sweets.quantity, quantity)))
      .returning();

    if (!updatedSweet) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock',
      });
    }

    // Create purchase audit record
    const newPurchase: NewPurchase = {
      userId,
      sweetId: id,
      quantity,
      totalPrice,
    };

    const [purchase] = await db.insert(purchases).values(newPurchase).returning();

    res.status(200).json({
      success: true,
      purchase,
      message: 'Purchase successful',
    });
  } catch (error) {
    console.error('Purchase sweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Restock sweet (Admin only)
export const restockSweet = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { quantity } = req.body;

    // Get current sweet
    const [sweet] = await db.select().from(sweets).where(eq(sweets.id, id)).limit(1);

    if (!sweet) {
      return res.status(404).json({
        success: false,
        message: 'Sweet not found',
      });
    }

    // Update quantity
    const [updatedSweet] = await db
      .update(sweets)
      .set({
        quantity: sweet.quantity + quantity,
        updatedAt: new Date(),
      })
      .where(eq(sweets.id, id))
      .returning();

    res.status(200).json({
      success: true,
      sweet: updatedSweet,
      message: 'Restock successful',
    });
  } catch (error) {
    console.error('Restock sweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
