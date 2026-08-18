export type ItemGenerado<T> = T & {
  posicionArancelaria: string;
  fobTotalDivisa: string;
  numeroItem: number;
};

type GenerarItemsParams<T> = {
  cantidadItems: number;
  posiciones: string[];
  fobTotal: string;
  itemBase: T;
};

export function generarItems<T>({
  cantidadItems,
  posiciones,
  fobTotal,
  itemBase
}: GenerarItemsParams<T>): ItemGenerado<T>[] {

  if (cantidadItems <= 0) {
    throw new Error(
      'La cantidad de items debe ser mayor a 0.'
    );
  }

  if (posiciones.length === 0) {
    throw new Error(
      'Debe existir al menos una posición arancelaria.'
    );
  }

  if (posiciones.length > cantidadItems) {
    throw new Error(
      'No puede seleccionar más posiciones que items.'
    );
  }

  const fob =
    Number(fobTotal);

  if (
    !Number.isFinite(fob) ||
    fob <= 0
  ) {
    throw new Error(
      `FOB total inválido: ${fobTotal}`
    );
  }

  const fobCentavos =
    Math.round(
      fob * 100
    );

  const base =
    Math.floor(
      fobCentavos /
      cantidadItems
    );

  const resto =
    fobCentavos -
    base * cantidadItems;

  return Array.from(
    {
      length:
        cantidadItems
    },
    (_, index) => {

      const posicion =
        posiciones[
          index %
          posiciones.length
        ];

      const centavosItem =
        base +
        (
          index < resto
            ? 1
            : 0
        );

      const fobItem =
        (
          centavosItem /
          100
        ).toFixed(2);

      return {
        ...itemBase,

        numeroItem:
          index + 1,

        posicionArancelaria:
          posicion,

        fobTotalDivisa:
          fobItem
      };
    }
  );
}