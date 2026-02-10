const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public folder (all menu images)
// URL paths will look like: /images/Menu/FOOD/Breakfasts/eggs-_-toast.jpg
app.use('/images', express.static(path.join(__dirname, 'public')));

// =======================
// Dynamic menu generation
// =======================
const MENU_ROOT = path.join(__dirname, 'public', 'Menu');

// Optional: load manual overrides from menu.json (descriptions, prices, etc.)
let manualMenu = [];
try {
  const menuJsonPath = path.join(__dirname, 'menu.json');
  if (fs.existsSync(menuJsonPath)) {
    const raw = fs.readFileSync(menuJsonPath, 'utf8');
    manualMenu = JSON.parse(raw);
    console.log(
      `Loaded ${manualMenu.length} manual menu entries from menu.json for overrides`
    );
  } else {
    console.warn('menu.json not found; proceeding with image-based menu only.');
  }
} catch (err) {
  console.error('Failed to read or parse menu.json. Ignoring manual overrides.', err);
  manualMenu = [];
}

const toTitleCase = (str) =>
  str
    .replace(/\.[^.]+$/, '') // remove extension
    .replace(/[_()+]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');

const buildMenuFromImages = () => {
  let items = [];
  let id = 1;

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg') continue;

        // Relative path from MENU_ROOT, e.g. "FOOD\\Breakfasts\\eggs-_-toast.jpg"
        const relFromMenu = path.relative(MENU_ROOT, fullPath);
        const parts = relFromMenu.split(path.sep);
        const main = (parts[0] || '').toUpperCase();
        const sub = parts[1] || 'General';

        const imagePath = `/images/Menu/${relFromMenu.replace(/\\/g, '/')}`;

        items.push({
          id: id++,
          name: toTitleCase(entry.name),
          description: '',
          price: 0,
          category: `${main} / ${sub}`,
          available: true,
          image: imagePath,
        });
      }
    }
  };

  if (fs.existsSync(MENU_ROOT)) {
    walk(MENU_ROOT);
  } else {
    console.warn('MENU_ROOT not found:', MENU_ROOT);
  }

   // If we have manual menu data, merge it in by matching on image path.
   // This lets menu.json control description/price/etc while keeping
   // dynamic discovery of images/categories.
   if (Array.isArray(manualMenu) && manualMenu.length > 0) {
     const overridesByImage = new Map();
     for (const entry of manualMenu) {
       if (entry && typeof entry.image === 'string') {
         overridesByImage.set(entry.image, entry);
       }
     }

     items = items.map((item) => {
       const override = overridesByImage.get(item.image);
       if (!override) return item;

       return {
         ...item,
         // Preserve dynamically assigned ID so frontend/order logic stays stable
         id: item.id,
         // Allow menu.json to override these fields when provided
         name: override.name || item.name,
         description:
           typeof override.description === 'string'
             ? override.description
             : item.description,
         price:
           typeof override.price === 'number' || typeof override.price === 'string'
             ? override.price
             : item.price,
         category: override.category || item.category,
         available:
           typeof override.available === 'boolean'
             ? override.available
             : item.available,
       };
     });
   }

  return items;
};

// Build menu once at startup; restart server if you add/remove images
let menu = buildMenuFromImages();

// In-memory storage for orders
let orders = [];

// Get menu
app.get('/api/menu', (req, res) => {
  res.json(menu);
});

// Submit order
app.post('/api/orders', (req, res) => {
  try {
    const order = {
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    orders.push(order);
    console.log('New order received:', order);
    res.status(201).json({ message: 'Order submitted successfully', orderId: order.id });
  } catch (error) {
    console.error('Error submitting order:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

// Get all orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Delete order (when processed)
app.delete('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const orderIndex = orders.findIndex(order => order.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  orders.splice(orderIndex, 1);
  res.json({ message: 'Order deleted successfully' });
});

// Track table scans (for analytics)
app.post('/api/tables/:id/scan', (req, res) => {
  const tableId = req.params.id;
  console.log(`Table ${tableId} scanned`);
  res.json({ success: true, tableId, timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Cloud Order API running on port ${PORT}`);
  console.log(`Images served from: ${path.join(__dirname, 'public/images')}`);
}); 