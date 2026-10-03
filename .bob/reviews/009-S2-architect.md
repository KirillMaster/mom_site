# Architect review 009-S2
Verdict: ok.
- Deps: components/artwork -> lib only (price, normalizeTitle, api); no import from app/. lib/price sole price source.
- (1) `as` h1: needed for artwork page heading; contract updated (enum + h1).
- (2) quotedTitle was dead in prod; MuseumLabel now uses it (removes duplicated guillemets).
- (3) RelatedWorks Partial<ArtworkDto> + cast to ArtworkDto: tolerable (price/size helpers handle missing); noted, not fixed.
Tests: jest 733 pass, tsc 0.
