# Algorithm Visualizer

This version keeps the original layout and design and is prepared for GitHub -> Vercel deployment.

## Local run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

Open `http://localhost:8000`

## Vercel

- Put **these files at the repository root**
- Import the repo into Vercel
- Keep the Root Directory as `/`
- No build command is needed
