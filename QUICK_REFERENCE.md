# Quick Reference - In and Out Car Wash System

## 🚀 Quick Start Commands

### Installation
```bash
# Install all dependencies (API, Web, Mobile)
npm run install-all

# Or install individually
npm run install-api
npm run install-web
npm run install-mobile
```

### Running Applications
```bash
# Start API Server (Port 3000)
npm run api

# Start Web Application (Port 5173)
npm run web

# Start Mobile App (Expo)
npm run mobile
```

### Testing
```bash
# Run all tests
npm test

# Run API tests only
npm run test:api

# Run Web tests only
npm run test:web

# Run with coverage
cd apps/api && npm test -- --coverage
cd apps/web && npm run test:coverage
```

### Documentation
```bash
# View API Documentation
npm run api
# Then open: http://localhost:3000/api-docs
```

---

## 📚 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| API Server | http://localhost:3000 | Backend REST API |
| API Health | http://localhost:3000/health | Server health check |
| API Docs | http://localhost:3000/api-docs | Interactive API documentation |
| Web App | http://localhost:5173 | React web application |
| Mobile App | Expo Go App | Scan QR code from terminal |

---

## 🔑 Key Files & Locations

### Configuration
- `.env` - Environment variables (API)
- `.env.example` - Environment template
- `apps/api/jest.config.js` - API test configuration
- `apps/web/vitest.config.js` - Web test configuration

### Documentation
- `README.md` - Project overview
- `TESTING_GUIDE.md` - Complete testing documentation
- `PROJECT_IMPROVEMENTS_2024.md` - Recent improvements log
- `SUPABASE_SETUP_GUIDE.md` - Database setup
- `COMPLETE_SYSTEM_OVERVIEW.md` - System architecture

### Testing
- `apps/api/src/__tests__/` - API tests
- `apps/web/src/__tests__/` - Web tests
- Coverage reports: `apps/{api,web}/coverage/`

---

## 🧪 Testing Quick Reference

### Running Specific Tests
```bash
# Run specific test file
cd apps/api
npm test User.test.js

# Run specific test case
npm test -- -t "should find user by email"

# Watch mode
npm run test:watch
```

### Coverage Thresholds
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Test Types
- **Unit Tests**: `apps/api/src/__tests__/models/`
- **Integration Tests**: `apps/api/src/__tests__/integration/`
- **Component Tests**: `apps/web/src/__tests__/`
- **Middleware Tests**: `apps/api/src/__tests__/middleware/`

---

## 🔐 Authentication

### Register New User
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890"
}
```

### Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Using JWT Token
```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🛠️ Common Tasks

### Adding a New API Endpoint

1. **Create route handler** in `apps/api/src/routes/`
2. **Add Swagger documentation**:
```javascript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     tags: [Tag Name]
 *     summary: Endpoint description
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/endpoint', async (req, res) => {
  // Handler logic
});
```
3. **Add validation** using `validationChains`
4. **Write tests** in `__tests__/routes/`
5. **Update documentation**

### Adding a New Model

1. **Create model** in `apps/api/src/models/`
2. **Write unit tests** in `__tests__/models/`
3. **Run tests**: `npm test ModelName.test.js`
4. **Add to Swagger schemas** in `config/swagger.js`

### Adding a New React Component

1. **Create component** in `apps/web/src/components/`
2. **Write tests** in `apps/web/src/__tests__/components/`
3. **Run tests**: `cd apps/web && npm test`
4. **Check coverage**: `npm run test:coverage`

---

## 🐛 Debugging

### API Debugging
```bash
# Enable verbose logging
NODE_ENV=development npm run dev

# View database queries
DEBUG=supabase:* npm run dev
```

### Test Debugging
```bash
# Verbose test output
npm test -- --verbose

# Debug in VSCode
# Add breakpoint, then F5 (Jest Debug configuration)
```

### Common Issues

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

**Database connection failed:**
- Check `.env` file exists
- Verify Supabase credentials
- Check internet connection
- Review `SUPABASE_SETUP_GUIDE.md`

**Tests failing:**
- Clear test cache: `npm test -- --clearCache`
- Update snapshots: `npm test -- -u`
- Check mock implementations

---

## 📦 Package Management

### Adding Dependencies

**Production dependency:**
```bash
cd apps/api
npm install package-name
```

**Development dependency:**
```bash
cd apps/api
npm install --save-dev package-name
```

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update all
npm update

# Security audit
npm audit
npm audit fix
```

---

## 🔒 Security

### Environment Variables
Never commit `.env` files! Use `.env.example` as template.

**Required variables:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `DATABASE_URL`

### Security Headers
Configured in `apps/api/src/middleware/security.js`:
- Helmet (CSP, XSS protection)
- CORS
- Rate limiting
- Input sanitization

### Rate Limits
- General: 100 requests / 15 minutes
- Auth: 5 requests / 15 minutes
- Payments: 3 requests / minute
- Bookings: 10 requests / minute

---

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### API Status
```bash
curl http://localhost:3000/api
```

### Logs
- API logs: Console output
- Test logs: `npm test -- --verbose`
- Coverage reports: `coverage/index.html`

---

## 🚨 Emergency Procedures

### System Down
1. Check logs: `npm run api` output
2. Verify database connection
3. Check environment variables
4. Review recent changes
5. Restart services

### Database Issues
1. Check Supabase dashboard
2. Verify connection string
3. Check credentials
4. Review database migrations
5. See `SUPABASE_SETUP_GUIDE.md`

### Test Failures
1. Run with verbose: `npm test -- --verbose`
2. Check recent code changes
3. Update snapshots if needed
4. Clear cache: `npm test -- --clearCache`
5. Check mock implementations

---

## 📞 Getting Help

### Documentation
1. `TESTING_GUIDE.md` - Testing help
2. `PROJECT_IMPROVEMENTS_2024.md` - Recent changes
3. `COMPLETE_SYSTEM_OVERVIEW.md` - Architecture
4. API Docs - http://localhost:3000/api-docs

### External Resources
- [Jest Docs](https://jestjs.io/)
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supabase Docs](https://supabase.com/docs)
- [Express.js Docs](https://expressjs.com/)

### Support Channels
- Review documentation files
- Check test examples
- Open GitHub issue
- Contact team lead

---

## 🎯 Best Practices

### Code Style
- ✅ Use async/await over promises
- ✅ Use const/let, not var
- ✅ Use arrow functions
- ✅ Add JSDoc comments
- ✅ Follow existing patterns

### Testing
- ✅ Write tests before fixing bugs
- ✅ Test edge cases
- ✅ Mock external dependencies
- ✅ Keep tests simple
- ✅ Achieve meaningful coverage

### Git Workflow
- ✅ Commit small, logical changes
- ✅ Write descriptive commit messages
- ✅ Run tests before committing
- ✅ Keep branches up to date
- ✅ Request code reviews

### Security
- ✅ Never commit secrets
- ✅ Use environment variables
- ✅ Validate all inputs
- ✅ Use parameterized queries
- ✅ Keep dependencies updated

---

## 📈 Performance Tips

### API Optimization
- Use database indexes
- Implement caching (Redis)
- Pagination for large datasets
- Optimize queries
- Use connection pooling

### Web Optimization
- Lazy load components
- Code splitting
- Image optimization
- Bundle size monitoring
- Use production builds

---

## 🎓 Learning Resources

### Beginners
1. Read `README.md`
2. Follow `QUICK_START.md`
3. Explore `TESTING_GUIDE.md`
4. Review code examples

### Intermediate
1. Study system architecture
2. Review test implementations
3. Understand middleware patterns
4. Learn error handling

### Advanced
1. Optimize database queries
2. Implement caching strategies
3. Add performance monitoring
4. Contribute to architecture

---

**Last Updated**: December 29, 2024
**Version**: 1.0.0

*Keep this file bookmarked for quick reference!*
