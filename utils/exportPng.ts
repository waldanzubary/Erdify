import { toPng } from 'html-to-image';

export async function exportToPng(element: HTMLElement, filename: string = 'erdify-diagram') {
    try {
        const dataUrl = await toPng(element, {
            backgroundColor: undefined, // Allow transparency
            quality: 1,
            pixelRatio: 3, // Higher quality for "premium" feel
            filter: (node) => {
                const exclusionClasses = [
                    'react-flow__controls',
                    'react-flow__minimap',
                    'react-flow__handle', // Hide indigo/white dots on export
                    'react-flow__attribution', // Clean up the bottom
                ];

                const htmlNode = node as HTMLElement;

                // Exclude LiveCursors component by checking parent hierarchy
                if (htmlNode?.closest?.('[class*="pointer-events-none"][class*="z-[9999]"]')) {
                    return false;
                }

                return !exclusionClasses.some((cls) =>
                    htmlNode?.classList?.contains(cls)
                );
            },
        });

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${filename}.png`;
        a.click();
    } catch (error) {
        console.error('Export to PNG failed:', error);
        throw error;
    }
}
