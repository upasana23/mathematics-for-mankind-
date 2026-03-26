import urllib.request, re;
html = urllib.request.urlopen('https://www.youtube.com/@mathematicsformankind-onlinecl').read().decode('utf-8');
match = re.search(r'"externalId":"(UC[a-zA-Z0-9_-]{22})"', html);
if match:
    print(match.group(1));
else:
    print("Not found");
