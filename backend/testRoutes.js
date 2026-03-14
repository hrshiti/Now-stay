import authRoutes from './routes/authRoutes.js';

console.log('✅ authRoutes imported successfully');
console.log('Routes registered:', authRoutes.stack.length);
authRoutes.stack.forEach((layer, i) => {
  if (layer.route) {
    console.log(`  ${i}: ${layer.route.methods.post ? 'POST' : layer.route.methods.get ? 'GET' : 'OTHER'} ${layer.route.path}`);
  }
});
