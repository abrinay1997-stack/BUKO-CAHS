# 📚 Guía Rápida: Git & GitHub para Carpetas

## 🎯 Lo Importante: Git maneja carpetas automáticamente

**No necesitas "crear carpetas" en GitHub**. Solo creas archivos con rutas y Git crea las carpetas por ti.

---

## 💻 Crear Carpetas Localmente y Subirlas

### Método 1: Terminal (Recomendado)

```bash
# 1. Crear carpeta
mkdir components

# 2. Crear archivo dentro
echo "// Mi componente" > components/Header.tsx

# 3. Git detecta automáticamente la carpeta
git add components/Header.tsx

# 4. Commit
git commit -m "Agregar Header component"

# 5. Push (la carpeta se crea en GitHub automáticamente)
git push origin main
```

### Método 2: Mover archivos existentes

```bash
# Si ya tienes archivos en la raíz:
mkdir views
mv Dashboard.tsx views/
mv Settings.tsx views/

git add .
git commit -m "Reorganizar en carpetas"
git push
```

---

## 🌐 Crear Carpetas desde GitHub Web

1. Click **"Add file" → "Create new file"**
2. En el campo de nombre, escribe:
   ```
   components/MyComponent.tsx
   ```
   (Al escribir `/`, GitHub crea la carpeta automáticamente)
3. Agrega contenido
4. Commit

**Truco:** Para crear carpetas vacías, añade un archivo `.gitkeep`:
```
components/.gitkeep
```

---

## 🔄 Comandos Útiles

```bash
# Ver estructura de carpetas
tree -L 2

# O sin tree instalado:
find . -type d -maxdepth 2 | grep -v ".git"

# Ver archivos agregados con sus rutas
git status

# Ver historial de cambios en carpetas
git log --stat

# Mover archivos SIN perder historial
git mv archivo.tsx nueva-carpeta/archivo.tsx
```

---

## ⚠️ Errores Comunes

### "Git no sube mi carpeta vacía"
**Solución:** Git NO sube carpetas vacías. Agrega un archivo `.gitkeep`:
```bash
mkdir empty-folder
touch empty-folder/.gitkeep
git add empty-folder/.gitkeep
```

### "Moví archivos y Git los ve como eliminados"
**Solución:** Usa `git mv` en lugar de `mv`:
```bash
# Mal:
mv archivo.tsx components/

# Bien:
git mv archivo.tsx components/
```

### "No veo las carpetas en GitHub después de push"
**Solución:** Verifica que hiciste `git add` y que los archivos están dentro:
```bash
git status  # Ver qué archivos están staged
git log --stat  # Ver qué se commiteó
```

---

## 🎨 Estructura Recomendada para React

```
proyecto/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   └── modals/
│   ├── views/
│   ├── hooks/
│   ├── utils/
│   ├── store/
│   └── types/
├── public/
├── package.json
└── vite.config.ts
```

**Crear todo de una vez:**
```bash
mkdir -p src/{components/{ui,modals},views,hooks,utils,store,types}
```

---

## 🚀 GitHub Desktop (Alternativa Visual)

Si prefieres NO usar terminal:

1. Descarga **GitHub Desktop**: https://desktop.github.com
2. Crea carpetas en tu editor (VSCode, etc.)
3. GitHub Desktop detecta los cambios automáticamente
4. Escribe mensaje de commit
5. Click **"Push origin"**

---

## 📖 Recursos

- [Git Basics - Recording Changes](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)
- [GitHub Docs - Adding Files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [Visualizing Git](https://git-school.github.io/visualizing-git/)

---

## ✨ Tip Pro

Usa un `.gitignore` para NO subir carpetas como `node_modules/`:

```gitignore
# .gitignore
node_modules/
dist/
.env
.DS_Store
```

¡Git ignorará estas carpetas automáticamente!
