function chunk<T>(array: T[], size: number): T[][] {
  return array.reduce((a, _, i) => {
    if (i % size === 0) {
      a.push(array.slice(i, i + size));
    }

    return a;
  }, []);
}

export { chunk };
