DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS first_name text,
    ADD COLUMN IF NOT EXISTS last_name text;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'display_name'
  ) THEN
    EXECUTE $sql$
      UPDATE public.profiles
      SET
        first_name = COALESCE(
          NULLIF(first_name, ''),
          NULLIF(split_part(trim(display_name), ' ', 1), ''),
          'Member'
        ),
        last_name = COALESCE(
          NULLIF(last_name, ''),
          NULLIF(trim(regexp_replace(trim(display_name), '^\S+\s*', '')), '')
        )
    $sql$;
  END IF;

  UPDATE public.profiles
  SET first_name = COALESCE(NULLIF(first_name, ''), 'Member')
  WHERE first_name IS NULL OR first_name = '';

  ALTER TABLE public.profiles
    ALTER COLUMN first_name SET NOT NULL;

  ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS display_name,
    DROP COLUMN IF EXISTS bio,
    DROP COLUMN IF EXISTS contact_viber,
    DROP COLUMN IF EXISTS contact_messenger;
END
$$;
