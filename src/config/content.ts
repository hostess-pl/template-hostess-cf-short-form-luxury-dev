import type { ImageMetadata } from 'astro';
import type { Locale } from './site.config';
import { loadHostess } from '@/lib/hostess';

let _bundleRef: ReturnType<typeof loadHostess> | null = null
let _bundle: ReturnType<typeof buildContentBundle> | null = null

const imageModules = import.meta.glob<{ default: ImageMetadata }>('../assets/images/*', {
  eager: true,
});

function resolveImage(fileName: string): ImageMetadata {
  const match = Object.entries(imageModules).find(([path]) => path.endsWith(`/${fileName}`));
  if (match) return match[1].default;
  const hero = Object.entries(imageModules).find(([path]) => path.endsWith('/hero.jpg'));
  if (hero) {
    console.warn(`[content] Missing image asset: ${fileName}; falling back to hero.jpg`);
    return hero[1].default;
  }
  throw new Error(`Missing image asset: ${fileName}`);
}

/** Local baked asset or remote/CMS URL. Never falls back to hero for events. */
export type EventImage =
  | { kind: 'local'; meta: ImageMetadata }
  | { kind: 'remote'; src: string };

function resolveEventImage(value: string): EventImage {
  const raw = String(value || '').trim();
  if (!raw) {
    return { kind: 'remote', src: '' };
  }
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) {
    return { kind: 'remote', src: raw };
  }
  const match = Object.entries(imageModules).find(([path]) => path.endsWith(`/${raw}`));
  if (match) return { kind: 'local', meta: match[1].default };
  return { kind: 'remote', src: `/cms-assets/${raw.replace(/^\/+/, '')}` };
}

function resolveVideo(fileName: string | undefined): string | null {
  if (!fileName) return null;
  return `/videos/${fileName}`;
}


export interface EducationDegree {
  id: string;
  name: string;
  year: string;
  university: string;
}

export interface FeaturedEvent {
  id: string;
  image: EventImage;
  video?: string | null;
  date: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  alt: Record<Locale, string>;
}

export interface TimelineEntry {
  id: string;
  date: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
}

export interface AppearanceFact {
  id: string;
  icon: 'height' | 'dress' | 'hair' | 'eyes' | 'license' | 'car';
  label: string;
  value: string;
}

export interface PortfolioContent {
  nav: Record<
    Locale,
    { work: string; about: string; experience: string; contact: string; cta: string }
  >;
  hero: Record<
    Locale,
    {
      eyebrow: string;
      headline: string;
      subheadlineIntro: string;
      subheadline: string;
      cta: string;
      ctaSecondary: string;
      elegantLead: string;
      elegantAccent: string;
      elegantSuffix: string;
      useUserHeadline: boolean;
    }
  >;
  cityRibbon: string;
  stats: Record<Locale, { label: string; value: string }[]>;
  elegantStats: Record<Locale, { label: string; value: string }[]>;
  languagesLabel: Record<Locale, string>;
  languages: Record<Locale, { name: string; level: string }[]>;
  about: Record<
    Locale,
    {
      title: string;
      lead: string;
      body: string;
      education: {
        label: string;
        university: string;
        showSharedUniversity: boolean;
        degrees: EducationDegree[];
      };
    }
  >;
  strengths: Record<Locale, string[]>;
  services: Record<Locale, ServiceItem[]>;
  gallery: Record<Locale, { label: string; title: string; subtitle: string }>;
  work: Record<Locale, { label: string; title: string; subtitle: string }>;
  aboutServices: Record<Locale, { title: string; heading: string }>;
  appearanceFacts: Record<Locale, AppearanceFact[]>;
  background: Record<Locale, { label: string; title: string; subtitle: string }>;
  contact: Record<
    Locale,
    {
      title: string;
      subtitle: string;
      directTitle: string;
      location: string;
      accentWord: string;
      form: {
        name: string;
        email: string;
        phone: string;
        message: string;
        submit: string;
        privacy: string;
        successTitle: string;
        successMessage: string;
        errorGeneric: string;
        errorName: string;
        errorEmail: string;
        errorMessage: string;
      };
    }
  >;
  footer: Record<Locale, { rights: string }>;
}

function buildContentBundle() {
  const hostess = loadHostess();


  function yearsSince(dateIso: string): string {
    if (!dateIso) return '1+';
    const start = new Date(dateIso);
    if (Number.isNaN(start.getTime())) return '1+';
    const years = Math.max(1, new Date().getFullYear() - start.getFullYear());
    return `${years}+`;
  }

  function localizeText(value: string): string {
    return value;
  }

  function eventYear(date: string): string {
    const match = String(date || '').match(/(\d{4})/);
    return match ? match[1] : String(date || '').trim();
  }

  function eventSortKey(date: string): string {
    const raw = String(date || '').trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const year = raw.match(/(\d{4})/);
    return year ? `${year[1]}-01-01` : '0000-01-01';
  }

  function defaultHeadline(locale: Locale): string {
    const labels: Record<Locale, string> = {
      en: 'A first impression that builds trust.',
      pl: 'Pierwsze wrażenie, które buduje zaufanie.',
      es: 'Una primera impresión que genera confianza.',
    };
    return labels[locale];
  }

  function defaultGreeting(locale: Locale, displayName: string): string {
    const labels: Record<Locale, string> = {
      en: `Hi, I'm ${displayName}!`,
      pl: `Cześć, jestem ${displayName}!`,
      es: `¡Hola, soy ${displayName}!`,
    };
    return labels[locale];
  }

  const PRESENT_LABEL: Record<Locale, string> = {
    en: 'present',
    pl: 'obecnie',
    es: 'actualidad',
  };

  function extractYear(value: string): string {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return String(parsed.getFullYear());
    const match = String(value || '').match(/\b(19|20)\d{2}\b/);
    return match?.[0] ?? '';
  }

  function formatYearRange(
    startDate: string | undefined,
    endDate: string | undefined,
    isOngoing: boolean | undefined,
    locale: Locale,
    fallbackDate = '',
  ): string {
    const present = PRESENT_LABEL[locale];
    const startYear = extractYear(startDate || '');
    const endYear = extractYear(endDate || '');
    if (isOngoing) {
      if (startYear && endYear) return `${startYear} – ${endYear} (${present})`;
      return startYear ? `${startYear} – ${present}` : present;
    }
    if (startYear && endYear) return `${startYear} – ${endYear}`;
    if (startYear || endYear) return startYear || endYear;
    return String(fallbackDate || '')
      .replace(/\bpresent\b/gi, present)
      .replace(/\bongoing\b/gi, present);
  }

  function formatStudyYear(entry: { startDate?: string; endDate?: string; isOngoing?: boolean }, locale: Locale): string {
    return formatYearRange(entry.startDate, entry.endDate, entry.isOngoing, locale);
  }

  function formatEmploymentYear(
    job: { startDate?: string; endDate?: string; date?: string; isOngoing?: boolean },
    locale: Locale,
  ): string {
    return formatYearRange(job.startDate, job.endDate, job.isOngoing, locale, job.date);
  }

  function mergeStrengthBadges(...groups: string[][]): string[] {
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const group of groups) {
      for (const raw of group) {
        const item = raw.trim();
        if (!item) continue;
        const key = item.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  }

  function studentOfDegreesLabel(locale: Locale, count: number): string {
    const labels: Record<Locale, string> = {
      en: `Student of ${count} degrees`,
      pl: count === 1 ? 'Studentka 1 kierunku' : `Studentka ${count} kierunków`,
      es: `Estudiante de ${count} carreras`,
    };
    return labels[locale];
  }


  function buildEducationDegrees(locale: Locale): EducationDegree[] {
    const entries = hostess.education.entries?.length
      ? hostess.education.entries
      : hostess.education.field || hostess.education.university
        ? [{
            id: 'study-1',
            field: hostess.education.field,
            university: hostess.education.university,
            startDate: '',
            endDate: '',
            isOngoing: hostess.education.isStudent,
          }]
        : [];

    return entries
      .filter((entry) => String(entry.field || '').trim().length > 0)
      .map((entry) => ({
        id: entry.id,
        name: String(entry.field).trim(),
        year: formatStudyYear(entry, locale),
        university: String(entry.university || '').trim(),
      }));
  }

  function buildCurrentWorkEntries(locale: Locale) {
    return hostess.employment
      .filter((job) => job.isOngoing)
      .map((job) => ({
        id: job.id,
        name: job.company ? `${job.title} · ${job.company}` : job.title,
        year: formatEmploymentYear(job, locale),
      }));
  }

  function buildEducationUniversity(degrees: EducationDegree[]): string {
    const universities = degrees
      .map((degree) => degree.university.trim())
      .filter((value) => value.length > 0);
    if (universities.length === 0) return '—';
    const unique = [...new Set(universities)];
    if (unique.length === 1) return unique[0];
    return '';
  }

  function countActiveStudies(): number {
    return (hostess.education.entries || []).filter((entry) => entry.isOngoing || entry.field).length
      || (hostess.education.field ? 1 : 0);
  }

  function buildStatsThirdColumn(locale: Locale): { label: string; value: string } {
    const statusLabels: Record<Locale, string> = {
      en: 'Status',
      pl: 'Status',
      es: 'Estado',
    };
    const coverageLabels: Record<Locale, string> = {
      en: 'Coverage',
      pl: 'Zasięg',
      es: 'Cobertura',
    };

    const professionalStatus = hostess.profile.professionalStatus?.trim();
    if (professionalStatus) {
      return { label: statusLabels[locale], value: professionalStatus };
    }

    const studyCount = countActiveStudies();
    if (studyCount >= 2) {
      return { label: statusLabels[locale], value: studentOfDegreesLabel(locale, studyCount) };
    }

    return { label: coverageLabels[locale], value: workCities };
  }

  const allStrengths = mergeStrengthBadges(hostess.skills, hostess.traits, hostess.languageCompetencies);
  const showStrengthsSection = allStrengths.length > 0;
  const showExperienceSection = hostess.employment.length > 0;

  function buildStrengths(): Record<Locale, string[]> {
    return { en: allStrengths, pl: allStrengths, es: allStrengths };
  }






  function splitEventTypes(): string[] {
    if (!hostess.experience.eventTypes.trim()) return [];
    return hostess.experience.eventTypes
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function buildServices(locale: Locale): ServiceItem[] {
    const eventTypeItems = splitEventTypes();
    const skillItems = hostess.skills.length > 0 ? hostess.skills : hostess.traits;
    const titles = [...eventTypeItems, ...skillItems].filter(
      (title, index, list) => list.indexOf(title) === index,
    );

    const fallback: Record<Locale, ServiceItem[]> = {
      en: [
        { id: 'svc-1', title: 'Private galas & balls', description: 'Discreet guest care at premium evening events.' },
        { id: 'svc-2', title: 'Fashion & brand events', description: 'Polished brand-facing presence with editorial composure.' },
        { id: 'svc-3', title: 'Corporate receptions', description: 'Reliable welcome and routing for distinguished guests.' },
      ],
      pl: [
        { id: 'svc-1', title: 'Gale prywatne i bale', description: 'Dyskretna opieka nad gośćmi na wieczornych eventach premium.' },
        { id: 'svc-2', title: 'Eventy fashion i marek', description: 'Reprezentacja marki z klasą i spokojem.' },
        { id: 'svc-3', title: 'Recepcje korporacyjne', description: 'Eleganckie powitanie i prowadzenie gości.' },
      ],
      es: [
        { id: 'svc-1', title: 'Galas y bailes privados', description: 'Atención discreta en eventos nocturnos premium.' },
        { id: 'svc-2', title: 'Eventos de moda y marca', description: 'Presencia de marca con compostura editorial.' },
        { id: 'svc-3', title: 'Recepciones corporativas', description: 'Bienvenida pulida y acompañamiento de invitados.' },
      ],
    };

    if (titles.length === 0) return fallback[locale].slice(0, 6);

    return titles.slice(0, 6).map((title, index) => {
      const matchedEvent = hostess.events.find((event) =>
        event.title.toLowerCase().includes(title.toLowerCase().slice(0, 8)),
      );
      const description =
        matchedEvent?.description?.trim() ||
        hostess.experience.eventTypes?.trim() ||
        hostess.bio.short;

      return {
        id: `svc-${index + 1}`,
        title,
        description: localizeText(description),
      };
    });
  }

  function buildAppearanceFacts(locale: Locale): AppearanceFact[] {
    const appearance = hostess.appearance ?? { height: '', dressSize: '', hairColor: '', eyeColor: '' };
    const mobility = hostess.mobility ?? { drivingLicense: '', hasCar: false };
    const labels: Record<Locale, Record<string, string>> = {
      en: { height: 'Height', size: 'Size', hair: 'Hair', eyes: 'Eyes', license: 'License', car: 'Car' },
      pl: { height: 'Wzrost', size: 'Rozmiar', hair: 'Włosy', eyes: 'Oczy', license: 'Prawo jazdy', car: 'Auto' },
      es: { height: 'Altura', size: 'Talla', hair: 'Cabello', eyes: 'Ojos', license: 'Carnet', car: 'Coche' },
    };

    const facts: AppearanceFact[] = [];
    if (appearance.height) {
      facts.push({ id: 'height', icon: 'height', label: labels[locale].height, value: appearance.height });
    }
    if (appearance.dressSize) {
      facts.push({ id: 'dress', icon: 'dress', label: labels[locale].size, value: appearance.dressSize });
    }
    if (appearance.hairColor) {
      facts.push({ id: 'hair', icon: 'hair', label: labels[locale].hair, value: appearance.hairColor });
    }
    if (appearance.eyeColor) {
      facts.push({ id: 'eyes', icon: 'eyes', label: labels[locale].eyes, value: appearance.eyeColor });
    }
    if (mobility.drivingLicense) {
      facts.push({
        id: 'license',
        icon: 'license',
        label: labels[locale].license,
        value: mobility.drivingLicense === 'yes'
          ? (locale === 'pl' ? 'Tak' : locale === 'es' ? 'Sí' : 'Yes')
          : mobility.drivingLicense,
      });
    }
    if (mobility.hasCar) {
      facts.push({
        id: 'car',
        icon: 'car',
        label: labels[locale].car,
        value: locale === 'pl' ? 'Tak' : locale === 'es' ? 'Sí' : 'Yes',
      });
    }
    return facts;
  }

  function buildElegantStats(locale: Locale): { label: string; value: string }[] {
    const years = yearsSince(hostess.experience.since);
    const professionalStatus =
      hostess.profile.professionalStatus?.trim() ||
      (hostess.education.isStudent ? (locale === 'pl' ? 'Studentka' : locale === 'es' ? 'Estudiante' : 'Student') : '');
    const statusValue = professionalStatus || (hostess.profile.workCities.join(', ') || hostess.profile.location);
    const statusLabel = professionalStatus
      ? { en: 'Status', pl: 'Status', es: 'Estado' }[locale]
      : { en: 'Coverage', pl: 'Zasięg', es: 'Cobertura' }[locale];

    const labels: Record<Locale, { years: string; location: string; languages: string }> = {
      en: { years: 'Experience', location: 'Location', languages: 'Languages' },
      pl: { years: 'Doświadczenie', location: 'Lokalizacja', languages: 'Języki' },
      es: { years: 'Experiencia', location: 'Ubicación', languages: 'Idiomas' },
    };

    return [
      { label: labels[locale].years, value: years },
      { label: labels[locale].location, value: hostess.profile.location || '—' },
      { label: statusLabel, value: statusValue || '—' },
      {
        label: labels[locale].languages,
        value: hostess.languages.length > 0 ? String(hostess.languages.length) : '—',
      },
    ];
  }

  const displayName = hostess.profile.displayName;
  const location = hostess.profile.location;
  const workCitiesList = hostess.profile.workCities;
  const workCities = workCitiesList.join(', ') || location;
  const cityRibbon = workCitiesList.length > 0 ? workCitiesList.join(' · ') : location;
  const experienceYears = yearsSince(hostess.experience.since);
  const hostessCopy = hostess.copy ?? {};
  const copyByLocale: Record<string, typeof hostessCopy> =
    (hostess as { copyByLocale?: Record<string, typeof hostessCopy> }).copyByLocale &&
    typeof (hostess as { copyByLocale?: unknown }).copyByLocale === 'object'
      ? ((hostess as unknown as { copyByLocale?: Record<string, typeof hostessCopy> }).copyByLocale ?? {})
      : {};

  function copyFor(locale: 'en' | 'pl' | 'es') {
    const localized = copyByLocale[locale];
    const pl = copyByLocale.pl;
    const base = localized ?? pl ?? hostessCopy;
    const pick = (key: string) => {
      const fromBase = base && typeof base === 'object' ? (base as Record<string, unknown>)[key] : '';
      const fromFlat = (hostessCopy as Record<string, unknown>)[key];
      return String(fromBase || fromFlat || '').trim();
    };
    return {
      headline: pick('headline'),
      greeting: pick('greeting'),
      profile: pick('profile'),
      aboutLead: pick('aboutLead'),
      experienceSummary: pick('experienceSummary'),
      galleryLabel: pick('galleryLabel'),
      galleryTitle: pick('galleryTitle'),
      aboutLabel: pick('aboutLabel'),
      aboutTitle: pick('aboutTitle'),
      experienceLabel: pick('experienceLabel'),
      experienceTitle: pick('experienceTitle'),
      contactLabel: pick('contactLabel'),
      contactTitle: pick('contactTitle'),
    };
  }
  const copyHeadline = String(hostessCopy.headline || '').trim();
  const copyGreeting = String(hostessCopy.greeting || '').trim();
  const copyProfile = String(hostessCopy.profile || '').trim();
  const copyAboutLead = String(hostessCopy.aboutLead || '').trim();
  const copyExperienceSummary = String(hostessCopy.experienceSummary || '').trim();
  const experienceText = String(hostess.experience.brands || '').trim();
  const aboutBody = copyExperienceSummary || hostess.experience.eventTypes || '';
  const heroProfileLine = copyProfile || hostess.bio.short;
  const aboutLeadLine = copyAboutLead || experienceText || hostess.bio.short;
  const strengths = buildStrengths();

  const galleryEvents: FeaturedEvent[] = [...hostess.events]
    .sort((a, b) => eventSortKey(b.date).localeCompare(eventSortKey(a.date)))
    .map((event) => ({
    id: event.id,
    image: resolveEventImage(event.imageFile),
    video: resolveVideo(event.videoFile),
    date: eventYear(event.date),
    title: {
      en: localizeText(event.title),
      pl: localizeText(event.title),
      es: localizeText(event.title),
    },
    description: {
      en: localizeText(event.description),
      pl: localizeText(event.description),
      es: localizeText(event.description),
    },
    alt: {
      en: event.title ? `${displayName} at ${event.title}` : `${displayName} portfolio`,
      pl: event.title ? `${displayName} — ${event.title}` : `${displayName} — portfolio`,
      es: event.title ? `${displayName} — ${event.title}` : `${displayName} — portfolio`,
    },
  }));

  function employmentSortKey(job: { startDate?: string; endDate?: string; isOngoing?: boolean }) {
    const start = String(job.startDate || '').trim();
    if (start) return start;
    return job.isOngoing ? '9999-12-31' : '0000-01-01';
  }

  const backgroundEntries: TimelineEntry[] = [...hostess.employment]
    .sort((a, b) => employmentSortKey(b).localeCompare(employmentSortKey(a)))
    .map((job) => ({
    id: job.id,
    date: {
      en: formatEmploymentYear(job, 'en'),
      pl: formatEmploymentYear(job, 'pl'),
      es: formatEmploymentYear(job, 'es'),
    },
    title: {
      en: job.company ? `${job.title} · ${job.company}` : job.title,
      pl: job.company ? `${job.title} · ${job.company}` : job.title,
      es: job.company ? `${job.title} · ${job.company}` : job.title,
    },
    description: {
      en: job.description,
      pl: job.description,
      es: job.description,
    },
  }));

  function buildHero(locale: Locale) {
    const elegantCopy: Record<Locale, { lead: string; accent: string; suffix: string }> = {
      en: { lead: 'The', accent: 'Hostess', suffix: 'You Need.' },
      pl: { lead: 'Hostessa,', accent: 'której', suffix: 'potrzebujesz.' },
      es: { lead: 'La', accent: 'azafata', suffix: 'que necesitas.' },
    };

    return {
      eyebrow: '',
      headline: (typeof copyFor === 'function' ? copyFor(locale).headline : copyHeadline) || defaultHeadline(locale),
      subheadlineIntro: (typeof copyFor === 'function' ? copyFor(locale).greeting : copyGreeting) || defaultGreeting(locale, displayName),
      subheadline: (typeof copyFor === 'function' ? copyFor(locale).profile : '') || heroProfileLine,
      cta: locale === 'pl' ? 'Zapytaj' : locale === 'es' ? 'Consultar' : 'Enquire',
      ctaSecondary:
        locale === 'pl' ? 'Zobacz portfolio' : locale === 'es' ? 'Ver trabajo' : 'See the work',
      elegantLead: elegantCopy[locale].lead,
      elegantAccent: elegantCopy[locale].accent,
      elegantSuffix: elegantCopy[locale].suffix,
      useUserHeadline: Boolean((typeof copyFor === 'function' ? copyFor(locale).headline : '') || copyHeadline),
    };
  }

  function buildAbout(locale: Locale) {
    const titles: Record<Locale, string> = {
      en: 'About me',
      pl: 'O mnie',
      es: 'Sobre mí',
    };
    const educationLabels: Record<Locale, string> = {
      en: 'Studies',
      pl: 'Studia',
      es: 'Estudios',
    };

    const degrees = buildEducationDegrees(locale);
    const sharedUniversity = buildEducationUniversity(degrees);

    return {
      title: titles[locale],
      lead: copyFor(locale).aboutLead || aboutLeadLine,
      body: copyFor(locale).experienceSummary || aboutBody,
      education: {
        label: educationLabels[locale],
        university: sharedUniversity || '—',
        showSharedUniversity: sharedUniversity.length > 0,
        degrees,
      },
    };
  }

  function buildStats(locale: Locale) {
    const third = buildStatsThirdColumn(locale);
    const labels: Record<Locale, { experience: string; location: string }> = {
      en: { experience: 'Experience', location: 'Location' },
      pl: { experience: 'Doświadczenie', location: 'Lokalizacja' },
      es: { experience: 'Experiencia', location: 'Ubicación' },
    };

    return [
      { label: labels[locale].experience, value: experienceYears },
      { label: labels[locale].location, value: location },
      third,
    ];
  }

  const content: PortfolioContent = {
    nav: {
      en: {
        work: copyFor('en').galleryLabel || 'Work',
        about: copyFor('en').aboutLabel || 'About',
        experience: copyFor('en').experienceLabel || 'Experience',
        contact: copyFor('en').contactLabel || 'Contact',
        cta: "Let's connect",
      },
      pl: {
        work: copyFor('pl').galleryLabel || 'Portfolio',
        about: copyFor('pl').aboutLabel || 'O mnie',
        experience: copyFor('pl').experienceLabel || 'Doświadczenie',
        contact: copyFor('pl').contactLabel || 'Kontakt',
        cta: 'Połączmy się',
      },
      es: {
        work: copyFor('es').galleryLabel || 'Trabajo',
        about: copyFor('es').aboutLabel || 'Sobre mí',
        experience: copyFor('es').experienceLabel || 'Experiencia',
        contact: copyFor('es').contactLabel || 'Contacto',
        cta: 'Conectemos',
      },
    },
    hero: {
      en: buildHero('en'),
      pl: buildHero('pl'),
      es: buildHero('es'),
    },
    cityRibbon,
    stats: {
      en: buildStats('en'),
      pl: buildStats('pl'),
      es: buildStats('es'),
    },
    elegantStats: {
      en: buildElegantStats('en'),
      pl: buildElegantStats('pl'),
      es: buildElegantStats('es'),
    },
    languagesLabel: {
      en: 'Languages',
      pl: 'Języki',
      es: 'Idiomas',
    },
    languages: {
      en: hostess.languages,
      pl: hostess.languages,
      es: hostess.languages,
    },
    about: {
      en: buildAbout('en'),
      pl: buildAbout('pl'),
      es: buildAbout('es'),
    },
    strengths,
    services: {
      en: buildServices('en'),
      pl: buildServices('pl'),
      es: buildServices('es'),
    },
    gallery: {
      en: {
        label: copyFor('en').galleryLabel || 'Portfolio',
        title: copyFor('en').galleryTitle || 'Selected events',
        subtitle: hostess.experience.eventTypes || 'Hostess roles at conferences and events.',
      },
      pl: {
        label: copyFor('pl').galleryLabel || 'Portfolio',
        title: copyFor('pl').galleryTitle || 'Wybrane wydarzenia',
        subtitle: hostess.experience.eventTypes || 'Doświadczenie jako hostessa na eventach.',
      },
      es: {
        label: copyFor('es').galleryLabel || 'Portfolio',
        title: copyFor('es').galleryTitle || 'Eventos destacados',
        subtitle: hostess.experience.eventTypes || 'Experiencia como azafata en eventos.',
      },
    },
    work: {
      en: {
        label: copyFor('en').galleryLabel || 'Portfolio',
        title: copyFor('en').galleryTitle || 'Selected events',
        subtitle: hostess.experience.eventTypes || 'Hostess roles at conferences and events.',
      },
      pl: {
        label: copyFor('pl').galleryLabel || 'Portfolio',
        title: copyFor('pl').galleryTitle || 'Wybrane wydarzenia',
        subtitle: hostess.experience.eventTypes || 'Doświadczenie jako hostessa na eventach.',
      },
      es: {
        label: copyFor('es').galleryLabel || 'Portfolio',
        title: copyFor('es').galleryTitle || 'Eventos destacados',
        subtitle: hostess.experience.eventTypes || 'Experiencia como azafata en eventos.',
      },
    },
    aboutServices: {
      en: {
        title: copyFor('en').aboutLabel || 'About',
        heading: copyFor('en').aboutTitle || 'Hospitality as an art',
      },
      pl: {
        title: copyFor('pl').aboutLabel || 'O mnie',
        heading: copyFor('pl').aboutTitle || 'Gościnność jako sztuka',
      },
      es: {
        title: copyFor('es').aboutLabel || 'Sobre mí',
        heading: copyFor('es').aboutTitle || 'La hospitalidad como arte',
      },
    },
    appearanceFacts: {
      en: buildAppearanceFacts('en'),
      pl: buildAppearanceFacts('pl'),
      es: buildAppearanceFacts('es'),
    },
    background: {
      en: {
        label: copyFor('en').experienceLabel || 'Experience',
        title: copyFor('en').experienceTitle || 'Employment History',
        subtitle: '',
      },
      pl: {
        label: copyFor('pl').experienceLabel || 'Doświadczenie',
        title: copyFor('pl').experienceTitle || 'Historia zatrudnienia',
        subtitle: '',
      },
      es: {
        label: copyFor('es').experienceLabel || 'Experiencia',
        title: copyFor('es').experienceTitle || 'Historial laboral',
        subtitle: '',
      },
    },
    contact: {
      en: {
        title: copyFor('en').contactTitle || "Let's talk about your",
        accentWord: 'event',
        subtitle: 'Available for conferences, brand events, and hospitality roles.',
        directTitle: 'Direct contact',
        location: `${location}${workCities ? ` · ${workCities}` : ''}`,
        form: {
          name: 'Your name',
          email: 'Email',
          phone: 'Phone (optional)',
          message: 'Tell me about the event or role',
          submit: 'Send message',
          privacy: 'I agree to be contacted regarding this inquiry.',
          successTitle: 'Message sent',
          successMessage: 'Thank you — I will get back to you shortly.',
          errorGeneric: 'Something went wrong. Please try again.',
          errorName: 'Please enter your name.',
          errorEmail: 'Please enter a valid email.',
          errorMessage: 'Please enter a message.',
        },
      },
      pl: {
        title: copyFor('pl').contactTitle || 'Porozmawiajmy',
        accentWord: 'o wydarzeniu',
        subtitle: 'Dostępna na konferencje, eventy marek i role w branży hospitality.',
        directTitle: 'Kontakt bezpośredni',
        location: `${location}${workCities ? ` · ${workCities}` : ''}`,
        form: {
          name: 'Imię i nazwisko',
          email: 'E-mail',
          phone: 'Telefon (opcjonalnie)',
          message: 'Opisz wydarzenie lub rolę',
          submit: 'Wyślij wiadomość',
          privacy: 'Wyrażam zgodę na kontakt w sprawie tego zapytania.',
          successTitle: 'Wiadomość wysłana',
          successMessage: 'Dziękuję — odezwę się wkrótce.',
          errorGeneric: 'Coś poszło nie tak. Spróbuj ponownie.',
          errorName: 'Podaj imię i nazwisko.',
          errorEmail: 'Podaj prawidłowy adres e-mail.',
          errorMessage: 'Wpisz wiadomość.',
        },
      },
      es: {
        title: copyFor('es').contactTitle || 'Hablemos de tu',
        accentWord: 'evento',
        subtitle: 'Disponible para conferencias, eventos de marca y roles en hostelería.',
        directTitle: 'Contacto directo',
        location: `${location}${workCities ? ` · ${workCities}` : ''}`,
        form: {
          name: 'Tu nombre',
          email: 'Correo electrónico',
          phone: 'Teléfono (opcional)',
          message: 'Cuéntame sobre el evento o el puesto',
          submit: 'Enviar mensaje',
          privacy: 'Acepto ser contactada respecto a esta consulta.',
          successTitle: 'Mensaje enviado',
          successMessage: 'Gracias — me pondré en contacto contigo pronto.',
          errorGeneric: 'Algo salió mal. Inténtalo de nuevo.',
          errorName: 'Introduce tu nombre.',
          errorEmail: 'Introduce un correo electrónico válido.',
          errorMessage: 'Escribe un mensaje.',
        },
      },
    },
    footer: {
      en: { rights: 'All rights reserved.' },
      pl: { rights: 'Wszelkie prawa zastrzeżone.' },
      es: { rights: 'Todos los derechos reservados.' },
    },
  };

  const heroImage = resolveImage('hero.jpg');

  const currentWorkEntries = {
    en: buildCurrentWorkEntries('en'),
    pl: buildCurrentWorkEntries('pl'),
    es: buildCurrentWorkEntries('es'),
  };
  return { showStrengthsSection, showExperienceSection, galleryEvents, backgroundEntries, content, heroImage, currentWorkEntries };
}

function getContentBundle() {
  const hostess = loadHostess();
  if (_bundle && _bundleRef === hostess) return _bundle;
  _bundleRef = hostess;
  _bundle = buildContentBundle();
  return _bundle;
}

export { getContentBundle };

export const galleryEvents = new Proxy([] as never[], {
  get(_t, prop) {
    const arr = getContentBundle().galleryEvents as unknown as unknown[]
    const value = Reflect.get(arr as object, prop)
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(arr) : value
  },
}) as unknown as ReturnType<typeof buildContentBundle>['galleryEvents']

export const backgroundEntries = new Proxy([] as never[], {
  get(_t, prop) {
    const arr = getContentBundle().backgroundEntries as unknown as unknown[]
    const value = Reflect.get(arr as object, prop)
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(arr) : value
  },
}) as unknown as ReturnType<typeof buildContentBundle>['backgroundEntries']

export const content: PortfolioContent = new Proxy({} as PortfolioContent, {
  get(_t, prop) {
    return Reflect.get(getContentBundle().content as object, prop)
  },
})

export const heroImage = new Proxy({} as Record<string, unknown>, {
  get(_t, prop) {
    const obj = getContentBundle().heroImage as object
    const value = Reflect.get(obj, prop)
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(obj) : value
  },
}) as unknown as ReturnType<typeof buildContentBundle>['heroImage']

export const currentWorkEntries = new Proxy({} as Record<string, unknown>, {
  get(_t, prop) {
    const obj = getContentBundle().currentWorkEntries as object
    const value = Reflect.get(obj, prop)
    return typeof value === 'function' ? (value as (...args: never[]) => unknown).bind(obj) : value
  },
}) as unknown as ReturnType<typeof buildContentBundle>['currentWorkEntries']

export function getShowStrengthsSection(): boolean {
  return getContentBundle().showStrengthsSection
}
/** @deprecated use getShowStrengthsSection() — kept as live getter for Astro conditionals via helper */
export const showStrengthsSection = {
  valueOf(): boolean { return getContentBundle().showStrengthsSection },
  [Symbol.toPrimitive](): boolean { return getContentBundle().showStrengthsSection },
} as unknown as boolean

export function getShowExperienceSection(): boolean {
  return getContentBundle().showExperienceSection
}
/** @deprecated use getShowExperienceSection() — kept as live getter for Astro conditionals via helper */
export const showExperienceSection = {
  valueOf(): boolean { return getContentBundle().showExperienceSection },
  [Symbol.toPrimitive](): boolean { return getContentBundle().showExperienceSection },
} as unknown as boolean

