// Server-side attachment normalizer:
// - Keeps the raw (timestamped) file_name on disk for the download URL
// - Returns a cleaned-up file_name for display (strips multer's timestamp suffix)
// - Rewrites file_path so it works as a public download URL

export const formatAttachment = (att) => {

    const isPathInNameColumn = att.file_name.includes('/') || att.file_name.includes('\\');
    
    const realPath = isPathInNameColumn ? att.file_name : att.file_path; // Π.χ. "public\files\41-123.docx"
    const realName = isPathInNameColumn ? att.file_path : att.file_name; // Π.χ. "Ομαδική εργασία.docx"

    let downloadUrl = realPath.replace(/\\/g, '/');
    downloadUrl = downloadUrl.replace(/^\/?public/, '');
    if (!downloadUrl.startsWith('/')) {
        downloadUrl = '/' + downloadUrl;
    }

    const cleanName = realName.replace(/-\d+-\d+(\.[^.]+)$/, '$1');

    return {
        ...att,
        file_name: cleanName,      
        file_path: downloadUrl     
    };
};
