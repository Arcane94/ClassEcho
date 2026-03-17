//Handles most of the logic in SectionTag routes and talks directly to SectionTag Model

//Retrieve the SectionTag Model
const SectionTag = require(`../models/SectionTagModel`);

// Creates a new section_tag entry in the database for the selected section
// POST /section_tags
exports.createSectionTag = async (req, res) => {
    //Try to pull payload from web
    try {
        //Save Body fields
        const {
            section_id,
            tag_name,
            is_selected
        } = req.body;

        //Ensure fields are all filled
        if (!section_id || !tag_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        //Save all fields to send to model
        const info = {
          section_id,
          tag_name,
          is_selected: is_selected ?? false,
        };

        const tag_id = await SectionTag.create(info);

        console.log('Retrieved tag id: ', tag_id);
        return res.status(201).json({ tag_id });
    } catch (error) {
        console.error('Unexpected error creating section tag', error);
        return res.status(500).json({ error: 'Unexpected Section Tag Creation Error'});
    }
};

// Logic to retrieve section_tag information from database using id
// GET /section_tags/:id
exports.getSectionTagById = async (req, res) => {
    try {
        //parse id from parameters
        const { id } = req.params;
      
        //Logic to retrieve section_tag from database using id
        const section_tag = await SectionTag.getById(id);
        console.log(section_tag);
        //Return a 404 error if section_tag cannot be found
        if (!section_tag) {
        return res.status(404).json({ error: 'Section Tag not found' });
        }

        return res.json(section_tag);
    } catch (err) {
        console.error('Error fetching section tag:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

//Logic to delete a section_tag entry from the database using id
//DELETE /section_tags/:id
exports.deleteSectionTagById = async (req, res) => {
    try {
        //parse id from parameters
        const { id } = req.params;
        //Logic to delete section_tag from database using id
        const deletedCount = await SectionTag.deleteById(id);
        if (deletedCount === 0) {
            return res.status(404).json({ error: 'Section Tag not found' });
        }
        return res.status(200).json({ message: 'Section Tag deleted successfully' });
    } catch (err) {
        console.error('Error deleting section tag:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
