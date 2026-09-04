import { getPreviewScale } from '../src/components/NextBlockPreview';

describe('NextBlockPreview', () => {
    test('keeps the active next block at a 10% zoom while other slots stay at 100%', () => {
        expect(getPreviewScale(0, 0)).toBeCloseTo(1.1, 10);
        expect(getPreviewScale(1, 0)).toBeCloseTo(1, 10);
        expect(getPreviewScale(3, 0)).toBeCloseTo(1, 10);
    });
});
