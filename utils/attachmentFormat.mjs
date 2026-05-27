
export const formatAttachment = (att) => {
    const uglyName = att.file_name;
    const cleanName = uglyName.replace(/-\d+-\d+(\.[^.]+)$/, '$1');

    let basePath = att.file_path.replace(/\\/g, '/');
    basePath = basePath.replace(/^\/?public/, '');
    if (!basePath.startsWith('/')) {
        basePath = '/' + basePath;
    }

    const pathParts = basePath.split('/');
    pathParts.pop();
    const realDownloadUrl = pathParts.join('/') + '/' + uglyName;

    return {
        ...att,
        file_name: cleanName,
        file_path: realDownloadUrl,
    };
};
