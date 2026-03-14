import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// User Upload Endpoint
export const uploadPhotoUser = async (req, res) => {
    const { file, submission_id, submitter_id } = req.body;

    // Authentication check
    const { user } = req
    if (!user || user.id !== submitter_id) {
        return res.status(403).json({ error: 'User not authenticated or invalid submission.' });
    }

    // Upload logic
    const { data, error } = await supabase.storage.from('staging').upload(`/${submission_id}/${file.name}`, file);

    if (error) return res.status(400).json({ error });

    return res.status(200).json({ data });
};

// Admin Upload Endpoint
export const uploadPhotoAdmin = async (req, res) => {
    const { file, venueId, timestamp } = req.body;

    // Admin authentication check
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Admin not authenticated.' });
    }

    // Upload logic
    const { data, error } = await supabase.storage.from('public').upload(`/${venueId}/${timestamp}.${file.extension}`, file);

    if (error) return res.status(400).json({ error });

    return res.status(200).json({ data });
};