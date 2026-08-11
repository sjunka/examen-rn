import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { showConfirmDialog, notifyGoalCompleted } from '../index';
import NativeRnSavingsNotifier from '../NativeRnSavingsNotifier';

jest.mock('../NativeRnSavingsNotifier', () => ({
  __esModule: true,
  default: {
    showConfirmDialog: jest.fn(),
    notifyGoalCompleted: jest.fn(),
  },
}));

const mockNative = NativeRnSavingsNotifier as jest.Mocked<
  typeof NativeRnSavingsNotifier
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('showConfirmDialog', () => {
  it('delega al módulo nativo con el título y el mensaje recibidos', async () => {
    mockNative.showConfirmDialog.mockResolvedValue(true);

    await showConfirmDialog('¿Confirmar?', 'Se abonarán $50.000');

    expect(mockNative.showConfirmDialog).toHaveBeenCalledWith(
      '¿Confirmar?',
      'Se abonarán $50.000'
    );
    expect(mockNative.showConfirmDialog).toHaveBeenCalledTimes(1);
  });

  it('resuelve true cuando el usuario acepta', async () => {
    mockNative.showConfirmDialog.mockResolvedValue(true);

    await expect(showConfirmDialog('Título', 'Mensaje')).resolves.toBe(true);
  });

  it('resuelve false cuando el usuario cancela', async () => {
    mockNative.showConfirmDialog.mockResolvedValue(false);

    await expect(showConfirmDialog('Título', 'Mensaje')).resolves.toBe(false);
  });

  it('rechaza sin llamar al nativo si el título está vacío', async () => {
    await expect(showConfirmDialog('', 'Mensaje')).rejects.toThrow(TypeError);
    expect(mockNative.showConfirmDialog).not.toHaveBeenCalled();
  });

  it('rechaza sin llamar al nativo si el título es solo espacios', async () => {
    await expect(showConfirmDialog('   ', 'Mensaje')).rejects.toThrow(
      TypeError
    );
    expect(mockNative.showConfirmDialog).not.toHaveBeenCalled();
  });

  it('rechaza sin llamar al nativo si el mensaje está vacío', async () => {
    await expect(showConfirmDialog('Título', '')).rejects.toThrow(TypeError);
    expect(mockNative.showConfirmDialog).not.toHaveBeenCalled();
  });

  it('rechaza sin llamar al nativo si el título no es un string', async () => {
    // @ts-expect-error -- validando en runtime un valor con tipo incorrecto
    await expect(showConfirmDialog(42, 'Mensaje')).rejects.toThrow(TypeError);
    expect(mockNative.showConfirmDialog).not.toHaveBeenCalled();
  });

  it('propaga el rechazo si el nativo falla de verdad', async () => {
    mockNative.showConfirmDialog.mockRejectedValue(
      new Error('no hay ventana visible')
    );

    await expect(showConfirmDialog('Título', 'Mensaje')).rejects.toThrow(
      'no hay ventana visible'
    );
  });
});

describe('notifyGoalCompleted', () => {
  it('delega al módulo nativo con el nombre de la meta recibido', async () => {
    mockNative.notifyGoalCompleted.mockResolvedValue(undefined);

    await notifyGoalCompleted('Viaje a la playa');

    expect(mockNative.notifyGoalCompleted).toHaveBeenCalledWith(
      'Viaje a la playa'
    );
    expect(mockNative.notifyGoalCompleted).toHaveBeenCalledTimes(1);
  });

  it('rechaza sin llamar al nativo si el nombre de la meta está vacío', async () => {
    await expect(notifyGoalCompleted('')).rejects.toThrow(TypeError);
    expect(mockNative.notifyGoalCompleted).not.toHaveBeenCalled();
  });

  it('rechaza sin llamar al nativo si el nombre de la meta no es un string', async () => {
    // @ts-expect-error -- validando en runtime un valor con tipo incorrecto
    await expect(notifyGoalCompleted(null)).rejects.toThrow(TypeError);
    expect(mockNative.notifyGoalCompleted).not.toHaveBeenCalled();
  });

  it('propaga el rechazo si el nativo falla de verdad', async () => {
    mockNative.notifyGoalCompleted.mockRejectedValue(
      new Error('no se pudo programar la notificación')
    );

    await expect(notifyGoalCompleted('Viaje a la playa')).rejects.toThrow(
      'no se pudo programar la notificación'
    );
  });
});
