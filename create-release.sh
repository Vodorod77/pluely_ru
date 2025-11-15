#!/bin/bash
set -e

echo "📦 Создание GitHub Release с Linux-пакетами..."

# Проверяем наличие gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) не установлен"
    echo "Установите: sudo apt install gh"
    exit 1
fi

# Проверяем авторизацию
if ! gh auth status &> /dev/null; then
    echo "🔑 Требуется авторизация в GitHub..."
    gh auth login
fi

VERSION="0.1.8"
TAG="app-v${VERSION}"

# Создаем релиз
echo "✅ Создаю релиз ${TAG}..."
gh release create "${TAG}" \
    --title "Pluely v${VERSION} (Linux + Windows + iOS/macOS)" \
    --notes "📦 **Скачайте установщик для вашей ОС:**

**Linux:**
- 🐧 DEB (Debian/Ubuntu): \`Pluely_${VERSION}_amd64.deb\` (15 MB)
- 🐧 RPM (Fedora/RHEL): \`Pluely-${VERSION}-1.x86_64.rpm\` (15 MB)
- 🐧 AppImage (Universal): \`Pluely_${VERSION}_amd64.AppImage\` (100 MB)

**Windows + macOS (собираются GitHub Actions):**
- 🪟 Windows: \`.msi\` и \`.exe\` будут добавлены после завершения Actions
- 🍎 macOS/iOS: \`aarch64\` и \`x86_64\` будут добавлены после завершения Actions

---

**✨ Полный перевод на русский язык**
- 620+ переведенных строк интерфейса
- Все настройки, диалоги и меню на русском
- Dev Space и горячие клавиши переведены

**🔧 Установка (Linux):**
\`\`\`bash
# Debian/Ubuntu
sudo dpkg -i Pluely_${VERSION}_amd64.deb

# Fedora/RHEL
sudo rpm -i Pluely-${VERSION}-1.x86_64.rpm

# AppImage (любой дистрибутив)
chmod +x Pluely_${VERSION}_amd64.AppImage
./Pluely_${VERSION}_amd64.AppImage
\`\`\`

⚠️ **macOS:** При блокировке откройте System Settings > Privacy & Security > Security, найдите 'pluely was blocked' и нажмите 'Allow Anyway'." \
    --draft \
    src-tauri/target/release/bundle/deb/Pluely_${VERSION}_amd64.deb \
    src-tauri/target/release/bundle/rpm/Pluely-${VERSION}-1.x86_64.rpm \
    src-tauri/target/release/bundle/appimage/Pluely_${VERSION}_amd64.AppImage

echo "✅ Релиз создан! Откройте:"
echo "   https://github.com/Vodorod77/pluely_ru/releases"
echo ""
echo "📝 Windows и macOS файлы будут добавлены автоматически после завершения GitHub Actions"
