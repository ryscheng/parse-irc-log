# parse-irc-log
Parsing IRC Logs

## Usage

```bash
  $ npm install
  $ mkdir -p data/
  $ cd data/
  $ wget -r -l 3 --no-parent https://irclogs.ubuntu.com/2016/
  $ cd ..
  $ node src/index.js ./data/irclogs.ubuntu.com/2016/
```

