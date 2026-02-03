# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e5]:
        - link "Administration" [ref=e7] [cursor=pointer]:
          - /url: /admin/dashboard
        - generic [ref=e8]:
          - generic [ref=e9]: Administrateur
          - button "Déconnexion" [ref=e10]:
            - img
            - text: Déconnexion
    - main [ref=e11]
    - contentinfo [ref=e117]:
      - paragraph [ref=e119]: Système de Gestion des Demandes Étudiantes - Administration
  - region "Notifications alt+T":
    - list:
      - listitem [ref=e120]:
        - img [ref=e122]
        - generic [ref=e126]: Connexion réussie !
  - alert [ref=e127]
```