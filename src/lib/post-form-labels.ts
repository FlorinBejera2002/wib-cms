/**
 * All user-facing text for the PostForm (new/edit article).
 * Change any value here and it updates everywhere in the form.
 */

export const POST_FORM_LABELS = {
  /* ── Action bar ── */
  editMode: 'Editare articol',
  createMode: 'Articol nou',
  saveEdit: 'Salveaza',
  saveCreate: 'Creeaza',
  previewButton: 'Preview',

  /* ── Sections ── */
  sectionContent: 'Continut',
  sectionSeo: 'SEO',
  sectionSocial: 'Social / Open Graph',
  sectionPublish: 'Publicare',
  sectionFeaturedImage: 'Imagine principala',

  /* ── Content card ── */
  titleLabel: 'Titlu',
  titlePlaceholder: 'Titlul articolului',
  slugLabel: 'Slug (URL)',
  slugPlaceholder: 'titlul-articolului',
  slugRegenerate: 'Regenereaza slug din titlu',
  contentLabel: 'Continut articol',
  excerptLabel: 'Rezumat',
  excerptPlaceholder: 'Un scurt rezumat al articolului...',

  /* ── SEO card ── */
  metaTitleLabel: 'Meta Title',
  metaTitlePlaceholder: 'Titlu pentru motoarele de cautare',
  metaDescriptionLabel: 'Meta Description',
  metaDescriptionPlaceholder: 'Descriere pentru motoarele de cautare',
  metaKeywordsLabel: 'Meta Keywords',
  metaKeywordsPlaceholder: 'cuvant1, cuvant2, cuvant3',

  /* ── Social / OG card ── */
  ogTitleLabel: 'OG Title',
  ogDescriptionLabel: 'OG Description',
  ogImageLabel: 'OG Image',
  ogImagePlaceholder: 'URL imagine sau alege din galerie',
  ogImagePickerTitle: 'Alege din galerie',

  /* ── Publish sidebar ── */
  statusLabel: 'Status',
  systemLabel: 'Sistem',
  authorLabel: 'Numele autorului',
  categoryLabel: 'Categorie',
  categoryPlaceholder: 'Selecteaza o categorie',
  categoryNone: 'Fara categorie',
  tagsLabel: 'Tag-uri',

  /* ── Status values ── */
  statusDraft: 'Ciorna',
  statusPending: 'In asteptare',
  statusPublished: 'Publicat',
  statusArchived: 'Arhivat',

  /* ── AI chat ── */
  aiButton: 'Asistent SEO',
  aiChatTitle: 'Asistent SEO',
  aiPlaceholder: 'Descrie ce doresti...',
  aiApply: 'Aplica',
  aiStop: 'Opreste',
  aiGenerating: 'Genereaza articol...',
  aiStreaming: 'Raspunde...',
  aiSelectionLabel: 'Selectie:',

  /* ── Confirm dialog ── */
  confirmTitle: 'Suprascrie continutul?',
  confirmDescription: 'Aceasta actiune va inlocui titlul, continutul, rezumatul si campurile SEO cu continut generat de AI.',
  confirmCancel: 'Anuleaza',
  confirmApply: 'Aplica',
} as const
