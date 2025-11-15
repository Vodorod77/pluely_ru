# 🌐 Contributing | Вклад в проект

## 🇷🇺 Russian Translation

Этот форк содержит полный русский перевод интерфейса Pluely.

### Что было сделано:
- ✅ 620+ ключей переведено на русский язык
- ✅ Все компоненты интерфейса локализованы
- ✅ Билингвальная документация (русский/английский)
- ✅ Сборки для всех платформ (Linux, Windows, macOS)

### Обновление с оригинальным репозиторием:

```bash
# Получить последние изменения из оригинала
git fetch upstream

# Слить изменения (с сохранением переводов)
git merge upstream/main

# Проверить конфликты в src/locales/
git status

# После разрешения конфликтов
git push origin master
```

---

## 🇬🇧 English Version

This fork contains full Russian translation of Pluely interface.

### What was done:
- ✅ 620+ keys translated to Russian
- ✅ All interface components localized
- ✅ Bilingual documentation (Russian/English)
- ✅ Builds for all platforms (Linux, Windows, macOS)

### Syncing with original repository:

```bash
# Fetch latest changes from original
git fetch upstream

# Merge changes (preserving translations)
git merge upstream/main

# Check for conflicts in src/locales/
git status

# After resolving conflicts
git push origin master
```

---

## 🌍 Adding New Languages | Добавление новых языков

### For translators | Для переводчиков:

1. Copy `src/locales/en.json` → `src/locales/YOUR_LANG.json`
2. Translate all 620+ keys in your language file
3. Add your language to `src/contexts/I18nContext.tsx`:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  ru: 'Русский',
  YOUR_CODE: 'Your Language Name'  // Add here
};
```

4. Update `src/components/LanguageSelector.tsx` if needed
5. Test all UI components in your language
6. Submit Pull Request with:
   - New translation file: `src/locales/YOUR_LANG.json`
   - Updated language list in `I18nContext.tsx`
   - Screenshots of translated interface

---

## 💰 Support the Project | Поддержать проект

See README for donation options.
Варианты поддержки смотрите в README.
