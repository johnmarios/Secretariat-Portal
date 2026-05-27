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
