import type { SceneConfig } from './types';
export class Configuration extends EventTarget {
  value!: SceneConfig;
  dirty = false;
  status = 'Läser konfiguration…';
  private revision = 0;
  private saving = false;
  private debounce?: ReturnType<typeof setTimeout>;
  async load() {
    const response = await fetch('/workspace-api/scene');
    if (!response.ok) throw new Error('Kunde inte läsa sparad konfiguration');
    this.value = await response.json(); this.status = 'Konfiguration läst'; this.dispatchEvent(new Event('status'));
  }
  changed() {
    this.dirty = true; ++this.revision; this.status = 'Osparade ändringar'; this.dispatchEvent(new Event('status'));
    clearTimeout(this.debounce); this.debounce = setTimeout(() => void this.save(), 1000);
  }
  async save() {
    clearTimeout(this.debounce);
    if (this.saving) return;
    const revision = this.revision;
    this.saving = true; this.status = 'Sparar…'; this.dispatchEvent(new Event('status'));
    try {
      const response = await fetch('/workspace-api/scene', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.value) });
      if (!response.ok) { const error = await response.json(); throw new Error(error.message ?? 'Kunde inte spara'); }
      if (revision === this.revision) { this.dirty = false; this.status = 'Sparat på disk'; }
    } catch (error) { this.status = error instanceof Error ? error.message : 'Kunde inte spara'; }
    finally {
      this.saving = false; this.dispatchEvent(new Event('status'));
      if (revision !== this.revision) void this.save();
    }
  }
}
