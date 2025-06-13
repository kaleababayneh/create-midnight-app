# 📦 Publishing Guide for create-midnight-app

This guide explains how to publish your `create-midnight-app` package to npm.

## 🚀 Quick Publish

```bash
# 1. Validate everything works
npm run validate

# 2. Login to npm (if not already logged in)
npm login

# 3. Publish to npm
npm publish
```

## 📋 Pre-Publishing Checklist

### ✅ **Package Ready**
- [ ] All dependencies installed (`npm install`)
- [ ] Validation tests pass (`npm run validate`)
- [ ] Version number updated in `package.json`
- [ ] README.md is complete and accurate
- [ ] LICENSE file exists

### ✅ **NPM Account Setup**
- [ ] NPM account created at [npmjs.com](https://www.npmjs.com)
- [ ] Logged in via `npm login`
- [ ] Package name is available (check: `npm view create-midnight-app`)

### ✅ **Repository Setup** (Optional but Recommended)
- [ ] Code pushed to GitHub
- [ ] Repository URL updated in `package.json`
- [ ] Issues/discussions enabled

## 📝 Step-by-Step Publishing

### 1. **Final Validation**
```bash
# This runs comprehensive tests
npm run validate
```

### 2. **Version Management**
```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major
```

### 3. **Publish**
```bash
# Standard publish
npm publish

# For first-time publish of scoped packages
npm publish --access public
```

## 🎯 After Publishing

### **Verify Publication**
```bash
# Check it's available
npm view create-midnight-app

# Test installation
npx create-midnight-app@latest test-install
```

### **Update Documentation**
- Update README with correct installation instructions
- Add badges (version, downloads, license)
- Create GitHub releases for major versions

## 📊 Usage Analytics

After publishing, you can track usage:
- **Downloads**: [npm-stat.com](https://npm-stat.com/charts.html?package=create-midnight-app)
- **Weekly Stats**: `npm info create-midnight-app`

## 🔄 Updates & Maintenance

### **Regular Updates**
1. Update dependencies: `npm update`
2. Test: `npm run validate`
3. Version bump: `npm version patch`
4. Publish: `npm publish`

### **Template Updates**
When updating the boilerplate template:
1. Update `templates/default/` with new boilerplate
2. Test with `npm run validate`
3. Increment version (minor for new features)
4. Publish

## 🎉 Success!

Once published, developers worldwide can use:
```bash
npx create-midnight-app my-awesome-project
```

Your scaffold will help accelerate Midnight blockchain development! 🌙✨

## 🛠️ Troubleshooting

### **Common Issues**
- **"Package name already exists"**: Choose a different name in `package.json`
- **"Login required"**: Run `npm login` and enter credentials
- **"Validation fails"**: Check error output, fix issues, retry

### **Package Updates**
- **Minor fixes**: Patch version (`1.0.1`)
- **New features**: Minor version (`1.1.0`)
- **Breaking changes**: Major version (`2.0.0`)

---

**Happy publishing! 📦🚀**
