update public.debate_questions
set title = E'医療ミスをした人は\n免許剥奪すべき？',
    updated_at = now()
where slug = 'license-revocation-for-medical-errors';
