function generateAvatar(text,foregroundColor = "blue",backgroundColor = "grey") {
    const canvas = document.createElement('canvas'); //html canvas element
    const context = canvas.getContext('2d'); //2d drawing context (πινέλο για 2d γραφικά)
    const size = 100;
    canvas.width = size;
    canvas.height = size;

    //draw background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, size, size);

    //draw text
    context.fillStyle = foregroundColor;
    context.font = '50px Arial';
    context.textAlign = 'center'; //horizontally center the text
    context.textBaseline = 'middle'; //vertically center the text
    context.fillText(text, size / 2, size / 2);

    return canvas.toDataURL("image/png"); // it's converted to an image
}

const avatar = document.getElementById('avatar');

if (avatar) {
    avatar.src = generateAvatar('GP', '#363B66', '#F5F5F5');

    avatar.addEventListener('mouseover', function() {
        avatar.src = generateAvatar('GP', '#363B66', '#f8f8f8');
    });

    avatar.addEventListener('mouseout', function() {
        avatar.src = generateAvatar('GP', '#363B66', '#F5F5F5');
    });
}