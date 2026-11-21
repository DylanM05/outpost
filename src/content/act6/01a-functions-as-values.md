---
id: functions-as-values
kind: predict
title: Functions as values
system: Signal filters
symbol: instrument
scene: console
skills: functional, reading-code
---

## Briefing

Beyond the inner ridge, the deep survey stations send back raw readings in half a dozen different formats. The filter rack applies a chosen conversion to a stream of numbers without knowing in advance which conversion it will be handed. Before you wire up your own filters, trace how a function travels as a plain value.

## Objective

Read the program below and type **exactly** what it prints, line by line.

## Concept

In Python, a function is a value just like a number or a list. Writing its name **without parentheses** refers to the function itself; adding parentheses **calls** it.

```python
def double(x):
    return x * 2

fn = double      # refers to the function, does not call it
print(fn(5))     # calls it: prints 10
```

Because a function is a value, you can pass it into another function as an argument, or keep functions in a list or dictionary. A function that takes another function as an argument is called a **higher-order function**.

## Hints

1. `transform(readings, adjust)` calls `adjust(item)` for each item in `readings`, and collects the returned values.
2. `to_celsius` subtracts 273 from each reading; `double` multiplies each reading by 2.
3. The second call passes `double` to the result of the first call — trace line by line.

## Program

```python
def to_celsius(kelvin):
    return kelvin - 273


def double(value):
    return value * 2


def transform(values, rule):
    result = []
    for value in values:
        result.append(rule(value))
    return result


raw = [273, 278, 283]
celsius = transform(raw, to_celsius)
print(celsius)
print(transform(celsius, double))
```

## Output

```text
[0, 5, 10]
[0, 10, 20]
```

## Restored

You traced how a rule moves through the filter rack as a value and runs only where it's called.
