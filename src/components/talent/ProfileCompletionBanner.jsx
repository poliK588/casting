import React from 'react';
import { Link } from 'react-router-dom';

const buildChecks = (user, mediaCount) => [
  { key: 'photo',     weight: 20, pass: !!user.heroImg },
  { key: 'media',     weight: 20, pass: mediaCount > 0 },
  { key: 'birthdate', weight: 10, pass: !!user._raw?.birth_date },
  { key: 'height',    weight: 10, pass: user.height_ft != null && user.height_in != null },
  { key: 'weight',    weight: 5,  pass: user.weight_lbs != null },
  { key: 'skills',    weight: 10, pass: user.skills?.length > 0 },
  { key: 'languages', weight: 10, pass: user.languages?.length > 0 },
  { key: 'location',  weight: 5,  pass: !!(user._raw?.city || user._raw?.province) },
  { key: 'union',     weight: 5,  pass: !!user.union_status },
  { key: 'bio',       weight: 5,  pass: !!user._raw?.description },
];

const CTA_LABELS = {
  birthdate: 'Add birth date',
  height:    'Set height',
  weight:    'Set weight',
  media:     'Upload media',
  photo:     'Upload photo',
  skills:    'Add skills',
  languages: 'Add languages',
  bio:       'Write a bio',
  location:  'Add location',
  union:     'Set union status',
};

const FIELD_IDS = {
  birthdate: 'field-birth_date',
  height:    'field-height_ft',
  weight:    'field-weight_lbs',
  media:     'section-media',
  photo:     'section-media',
  skills:    'field-skills',
  languages: 'field-languages',
  bio:       'field-description',
  location:  'field-city',
  union:     'field-union_status',
};

export default function ProfileCompletionBanner({ user, mediaCount = 0 }) {
  if (!user) return null;

  const checks = buildChecks(user, mediaCount);
  const percent = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0);

  if (percent === 100) return null;

  const tier =
    percent >= 80 ? { label: 'EXCELLENT',  color: 'text-emerald-400', bar: 'bg-emerald-500' } :
    percent >= 60 ? { label: 'GOOD',       color: 'text-indigo-400',  bar: 'bg-indigo-500'  } :
    percent >= 40 ? { label: 'FAIR',       color: 'text-amber-400',   bar: 'bg-amber-500'   } :
                    { label: 'INCOMPLETE', color: 'text-red-400',     bar: 'bg-red-500'     };

  const message =
    percent >= 80 ? 'Your profile is great. Add more details to stand out even more.' :
    percent >= 60 ? 'Good progress. A few more details will make you more visible to agents.' :
    percent >= 40 ? 'Keep going. Complete your profile to get noticed by casting directors.' :
                    'Your profile needs attention. Complete it to appear in search results.';

  const firstMissing = checks.find(c => !c.pass);
  const ctaLabel = firstMissing ? (CTA_LABELS[firstMissing.key] || 'Finish your profile') : null;
  const targetId = firstMissing ? FIELD_IDS[firstMissing.key] : null;

  const handleCtaClick = (e) => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = el.matches('input,select,textarea') ? el : el.querySelector('input,select,textarea');
      if (focusable) setTimeout(() => focusable.focus(), 400);
    }
  };

  return (
    <div className="sticky top-0 z-40 glass-panel !rounded-[14px] px-6 py-3 flex flex-col gap-2.5">

      {/* Row 1: label + percent */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest uppercase text-white/50">
          Profile Strength:&nbsp;
          <span className={tier.color}>{tier.label}</span>
        </span>
        <span className={`text-sm font-extrabold tabular-nums ${tier.color}`}>
          {percent}%
        </span>
      </div>

      {/* Row 2: progress bar */}
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${tier.bar}`}
          style={{ width: `${percent}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </div>

      {/* Row 3: message + CTA */}
      <div className="flex items-center justify-between gap-6">
        <p className="text-xs text-white/40 leading-relaxed">{message}</p>
        {ctaLabel && (
          <Link
            to="/talent/profile"
            onClick={handleCtaClick}
            className="flex-shrink-0 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap hover:underline"
          >
            {ctaLabel} →
          </Link>
        )}
      </div>

    </div>
  );
}
